/**
 * Tool 调用日志服务
 *
 * 所属模块：
 * * main-server/modules/runtime
 *
 * 文件作用：
 * * 封装 tool_call_logs 的创建与状态回写逻辑
 *
 * 依赖：
 * * ToolCallLogRepository
 */

import { ToolCallLogRepository } from "../../../repositories/tool-call-log.repository";

export class ToolCallLogService {
  constructor(private readonly repository: ToolCallLogRepository) {}

  async onStart(payload: {
    runId?: string;
    sessionId?: string;
    toolName: string;
    args: unknown;
  }): Promise<{ logId: string; startedAt: number }> {
    const row = await this.repository.createLog({
      runId: payload.runId,
      sessionId: payload.sessionId,
      toolName: payload.toolName,
      argsJson: payload.args as never,
      status: "started",
    });
    return { logId: row.id, startedAt: Date.now() };
  }

  async onSuccess(logId: string, startedAt: number, result: unknown): Promise<void> {
    const durationMs = Date.now() - startedAt;
    await this.repository.completeLog(
      logId,
      JSON.stringify(result).slice(0, 500),
      durationMs,
    );
  }

  async onFailure(logId: string, startedAt: number, error: unknown): Promise<void> {
    const durationMs = Date.now() - startedAt;
    await this.repository.failLog(
      logId,
      error instanceof Error ? error.message : "tool execution failed",
      durationMs,
    );
  }
}

