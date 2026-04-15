/**
 * Model Invoke Log 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 model_invoke_logs 表读写能力
 */

import { Prisma, type ModelInvokeLog } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class ModelInvokeLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(data: Prisma.ModelInvokeLogUncheckedCreateInput): Promise<ModelInvokeLog> {
    return this.prisma.modelInvokeLog.create({ data });
  }

  async completeLog(
    id: string,
    payload: {
      latencyMs?: number;
      usageJson?: Prisma.JsonValue;
      finishReason?: string;
      attemptsJson?: Prisma.JsonValue;
    },
  ): Promise<ModelInvokeLog> {
    return this.prisma.modelInvokeLog.update({
      where: { id },
      data: {
        success: true,
        latencyMs: payload.latencyMs,
        usageJson:
          payload.usageJson === null
            ? Prisma.JsonNull
            : (payload.usageJson as Prisma.InputJsonValue | undefined),
        finishReason: payload.finishReason,
        attemptsJson:
          payload.attemptsJson === null
            ? Prisma.JsonNull
            : (payload.attemptsJson as Prisma.InputJsonValue | undefined),
      },
    });
  }

  async failLog(id: string, errorMessage: string): Promise<ModelInvokeLog> {
    return this.prisma.modelInvokeLog.update({
      where: { id },
      data: {
        success: false,
        errorMessage,
      },
    });
  }

  async getByRequestId(requestId: string): Promise<ModelInvokeLog | null> {
    return this.prisma.modelInvokeLog.findUnique({
      where: { requestId },
    });
  }
}
