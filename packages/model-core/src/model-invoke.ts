/**
 * 模型调用编排服务
 *
 * 所属模块：
 * * model-core
 *
 * 文件作用：
 * * 编排模型调用主流程（校验、路由、provider 调用、重试、回退）
 *
 * 主要功能：
 * * ModelInvokeService.invoke
 *
 * 依赖：
 * * model-catalog
 * * model-router
 * * retry-policy
 * * fallback-policy
 * * mock-provider 适配接口
 */

import type { ModelInvokeRequest, ModelInvokeResponse } from "protocol";
import type { ModelCatalog } from "./model-catalog";
import { MODEL_ERROR_CODES, ModelCoreError } from "./model-errors";
import type { FallbackPolicy } from "./fallback-policy";
import type { ProviderAdapter } from "./providers/mock-provider";
import type { RetryPolicy } from "./retry-policy";
import { ModelRouter } from "./model-router";

/**
 * 模型调用服务构造参数
 */
export interface ModelInvokeServiceOptions {
  catalog: ModelCatalog;
  router: ModelRouter;
  providerAdapter: ProviderAdapter;
  retryPolicy: RetryPolicy;
  fallbackPolicy: FallbackPolicy;
}

/**
 * 模型调用服务
 */
export class ModelInvokeService {
  constructor(private readonly options: ModelInvokeServiceOptions) {}

  /**
   * 调用模型
   *
   * 功能说明：
   * * 校验 modelId
   * * 路由模型
   * * 执行 provider 调用
   * * 在失败时进行重试与回退
   *
   * @param req 模型调用请求
   * @returns 模型调用响应
   *
   * @throws ModelCoreError 当模型不存在、provider 失败且无回退时抛出
   */
  async invoke(req: ModelInvokeRequest): Promise<ModelInvokeResponse> {
    return this.invokeInternal(req, false);
  }

  /**
   * 流式调用模型
   *
   * 功能说明：
   * * 与 invoke 共用路由、重试与回退策略
   * * 强制以流式 adapter 执行 provider 调用
   *
   * @param req 模型调用请求
   * @returns 模型流式调用响应
   */
  async streamInvoke(req: ModelInvokeRequest): Promise<ModelInvokeResponse> {
    return this.invokeInternal(
      {
        ...req,
        stream: true,
      },
      true,
    );
  }

  /**
   * 确认模型存在
   *
   * @param modelId 模型 ID
   * @returns 无返回值
   *
   * @throws ModelCoreError 当模型不存在时抛出 MODEL_NOT_FOUND
   */
  private async ensureModelExists(modelId: string): Promise<void> {
    const model = await this.options.catalog.get(modelId);
    if (model) {
      return;
    }
    throw new ModelCoreError(
      MODEL_ERROR_CODES.MODEL_NOT_FOUND,
      `Model not found: ${modelId}`,
    );
  }

  /**
   * 带重试执行 provider 调用
   *
   * @param params provider 调用参数
   * @returns 统一模型流式事件
   *
   * @throws ModelCoreError 当 provider 调用在重试后仍失败时抛出
   */
  private async invokeWithRetry(
    params: Parameters<ProviderAdapter["invoke"]>[0],
    forceStream: boolean,
  ): Promise<ModelInvokeResponse["events"]> {
    let attempt = 0;
    let lastError: unknown = null;

    while (true) {
      attempt += 1;
      try {
        const providerPromise = forceStream
          ? this.options.providerAdapter.streamInvoke(params)
          : this.options.providerAdapter.invoke(params);
        const response = await this.withTimeout(providerPromise, params.timeoutMs);
        return response.events;
      } catch (error) {
        lastError = error;
        if (!this.options.retryPolicy.shouldRetry(attempt, error)) {
          break;
        }
      }
    }

    if (lastError instanceof ModelCoreError) {
      throw lastError;
    }
    throw new ModelCoreError(
      MODEL_ERROR_CODES.MODEL_PROVIDER_FAILED,
      lastError instanceof Error ? lastError.message : "Model provider failed",
    );
  }

  /**
   * 统一模型调用编排
   *
   * 功能说明：
   * * 执行选模、重试、回退与 attempts 记录
   *
   * @param req 模型调用请求
   * @param forceStream 是否强制流式
   * @returns 调用响应
   */
  private async invokeInternal(
    req: ModelInvokeRequest,
    forceStream: boolean,
  ): Promise<ModelInvokeResponse> {
    const timeoutMs = req.timeoutMs ?? 30000;
    const resolved = await this.options.router.resolve({
      modelId: req.modelId,
      preferredModelId: req.preferredModelId,
      requiresTools: req.requiresTools,
      requiresStreaming: req.requiresStreaming ?? forceStream,
      requiresJson: req.requiresJson,
      latencyTier: req.latencyTier,
      priority: req.priority,
    });

    const candidateModels = [resolved.primary, ...resolved.fallbacks];
    const modelById = new Map(candidateModels.map((item) => [item.modelId, item] as const));
    const attempts: ModelInvokeResponse["attempts"] = [];
    let lastError: ModelCoreError | null = null;

    if (req.modelId) {
      await this.ensureModelExists(req.modelId);
    }

    let currentModel: (typeof candidateModels)[number] | undefined = resolved.primary;
    const visited = new Set<string>();

    while (currentModel && !visited.has(currentModel.modelId)) {
      visited.add(currentModel.modelId);
      try {
        const events = await this.invokeWithRetry(
          {
            runId: req.runId,
            sessionId: req.sessionId,
            userId: req.userId,
            model: currentModel,
            messages: req.messages,
            stream: req.stream ?? true,
            timeoutMs,
            metadata: req.metadata,
          },
          forceStream,
        );
        attempts.push({
          modelId: currentModel.modelId,
          attempt: attempts.length + 1,
          success: true,
        });
        return {
          ok: true,
          modelId: currentModel.modelId,
          events,
          attempts,
        };
      } catch (error) {
        const modelError =
          error instanceof ModelCoreError
            ? error
            : new ModelCoreError(
                MODEL_ERROR_CODES.MODEL_PROVIDER_FAILED,
                error instanceof Error ? error.message : "Model provider failed",
              );
        attempts.push({
          modelId: currentModel.modelId,
          attempt: attempts.length + 1,
          success: false,
          errorCode: modelError.code,
          errorMessage: modelError.message,
        });
        lastError = modelError;

        const candidateIds = candidateModels.map((item) => item.modelId);
        const fallbackId = this.options.fallbackPolicy.getFallbackModelId(
          currentModel.modelId,
          candidateIds,
        );
        currentModel = fallbackId ? modelById.get(fallbackId) : undefined;
      }
    }

    throw new ModelCoreError(
      MODEL_ERROR_CODES.MODEL_FALLBACK_EXHAUSTED,
      lastError?.message ?? "Model fallback exhausted",
    );
  }

  /**
   * 执行超时控制
   *
   * @param promise 原始调用
   * @param timeoutMs 超时时间
   * @returns 原始结果
   *
   * @throws ModelCoreError 当调用超时时抛出 MODEL_TIMEOUT
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new ModelCoreError(
            MODEL_ERROR_CODES.MODEL_TIMEOUT,
            `Model invocation timeout after ${timeoutMs}ms`,
          ),
        );
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }
}
