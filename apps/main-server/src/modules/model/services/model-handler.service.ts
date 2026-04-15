/**
 * Model Handler 模块服务
 *
 * 所属模块：
 * * main-server/modules/model
 *
 * 文件作用：
 * * 承接 internal model API 的业务编排
 * * 统一封装 invoke 与 streamInvoke 调用路径
 *
 * 主要功能：
 * * listModels
 * * invoke
 * * streamInvoke
 *
 * 依赖：
 * * model-gateway
 * * response adapter
 * * streaming adapter
 *
 * 注意事项：
 * * 服务层只负责编排，不处理 HTTP 细节
 */

import type { ModelCatalogItem, ModelInvokeRequest } from "protocol";
import type { ModelStreamEvent } from "protocol";
import type { ModelGateway } from "../../../gateways/model-gateway";
import { toModelInvokeData, type ModelInvokeResponseData } from "../adapters/model-response.adapter";
import { normalizeStreamEvents } from "../streaming/model-streaming.adapter";
import { ModelInvokeLogService } from "./model-invoke-log.service";

/**
 * Model handler 服务
 */
export class ModelHandlerService {
  constructor(
    private readonly modelGateway: ModelGateway,
    private readonly modelInvokeLogService?: ModelInvokeLogService,
  ) {}

  /**
   * 获取模型目录
   *
   * @returns 模型列表
   */
  async listModels(): Promise<ModelCatalogItem[]> {
    return this.modelGateway.listModels();
  }

  /**
   * 执行非流式模型调用
   *
   * @param request 模型调用请求
   * @returns 适配后的调用数据
   */
  async invoke(request: ModelInvokeRequest): Promise<ModelInvokeResponseData> {
    const log = await this.modelInvokeLogService?.onStart({
      runId: request.runId,
      modelId: request.modelId ?? request.preferredModelId ?? "mock-general",
    });
    try {
      const response = await this.modelGateway.invokeModel(request);
      const doneEvent = response.events.find(
        (item): item is Extract<ModelStreamEvent, { type: "done" }> =>
          item.type === "done",
      );
      await this.modelInvokeLogService?.onSuccess(log?.logId ?? "", log?.startedAt ?? Date.now(), {
        usage: doneEvent?.usage,
        finishReason: "completed",
        attempts: response.attempts,
      });
      return toModelInvokeData(response);
    } catch (error) {
      if (log?.logId) {
        await this.modelInvokeLogService?.onFailure(log.logId, error);
      }
      throw error;
    }
  }

  /**
   * 执行流式模型调用
   *
   * @param request 模型调用请求
   * @returns 适配后的调用数据
   */
  async streamInvoke(
    request: ModelInvokeRequest,
  ): Promise<ModelInvokeResponseData> {
    const log = await this.modelInvokeLogService?.onStart({
      runId: request.runId,
      modelId: request.modelId ?? request.preferredModelId ?? "mock-general",
    });
    try {
      const response = await this.modelGateway.streamInvokeModel({
        ...request,
        stream: true,
      });
      const doneEvent = response.events.find(
        (item): item is Extract<ModelStreamEvent, { type: "done" }> =>
          item.type === "done",
      );
      await this.modelInvokeLogService?.onSuccess(log?.logId ?? "", log?.startedAt ?? Date.now(), {
        usage: doneEvent?.usage,
        finishReason: "completed",
        attempts: response.attempts,
      });
      return {
        ...toModelInvokeData(response),
        events: normalizeStreamEvents(response.events),
      };
    } catch (error) {
      if (log?.logId) {
        await this.modelInvokeLogService?.onFailure(log.logId, error);
      }
      throw error;
    }
  }
}
