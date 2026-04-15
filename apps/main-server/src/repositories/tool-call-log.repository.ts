/**
 * Tool Call Log 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 tool_call_logs 表读写能力
 */

import type { Prisma, ToolCallLog } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class ToolCallLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(data: Prisma.ToolCallLogUncheckedCreateInput): Promise<ToolCallLog> {
    return this.prisma.toolCallLog.create({ data });
  }

  async completeLog(logId: string, resultSummary?: string, durationMs?: number): Promise<ToolCallLog> {
    return this.prisma.toolCallLog.update({
      where: { id: logId },
      data: {
        status: "completed",
        resultSummary,
        durationMs,
      },
    });
  }

  async failLog(logId: string, errorMessage: string, durationMs?: number): Promise<ToolCallLog> {
    return this.prisma.toolCallLog.update({
      where: { id: logId },
      data: {
        status: "failed",
        errorMessage,
        durationMs,
      },
    });
  }

  async listByRunId(runId: string): Promise<ToolCallLog[]> {
    return this.prisma.toolCallLog.findMany({
      where: { runId },
      orderBy: { createdAt: "desc" },
    });
  }
}
