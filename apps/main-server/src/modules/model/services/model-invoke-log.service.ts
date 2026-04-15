/**
 * Model Invoke 日志服务
 *
 * 所属模块：
 * * main-server/modules/model
 *
 * 文件作用：
 * * 封装 model_invoke_logs 的创建与状态回写
 */

import { randomUUID } from "node:crypto";
import { ModelInvokeLogRepository } from "../../../repositories/model-invoke-log.repository";

export class ModelInvokeLogService {
  constructor(private readonly repository: ModelInvokeLogRepository) {}

  async onStart(payload: {
    runId?: string;
    modelId: string;
    provider?: string;
  }): Promise<{ logId: string; requestId: string; startedAt: number }> {
    const requestId = `model_req_${randomUUID()}`;
    const row = await this.repository.createLog({
      requestId,
      runId: payload.runId,
      modelId: payload.modelId,
      provider: payload.provider ?? "mock-provider",
      success: false,
    });
    return {
      logId: row.id,
      requestId,
      startedAt: Date.now(),
    };
  }

  async onSuccess(
    logId: string,
    startedAt: number,
    payload: {
      usage?: unknown;
      finishReason?: string;
      attempts?: unknown;
    },
  ): Promise<void> {
    await this.repository.completeLog(logId, {
      latencyMs: Date.now() - startedAt,
      usageJson: (payload.usage ?? undefined) as never,
      finishReason: payload.finishReason,
      attemptsJson: (payload.attempts ?? undefined) as never,
    });
  }

  async onFailure(logId: string, error: unknown): Promise<void> {
    await this.repository.failLog(
      logId,
      error instanceof Error ? error.message : "model invoke failed",
    );
  }
}

