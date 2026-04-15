/**
 * Run Event 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 run_events 表读写能力
 */

import type { Prisma, RunEvent } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class RunEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async appendEvent(data: Prisma.RunEventCreateInput): Promise<RunEvent> {
    return this.prisma.runEvent.create({ data });
  }

  async listEventsByRunId(runId: string): Promise<RunEvent[]> {
    return this.prisma.runEvent.findMany({
      where: { runId },
      orderBy: { createdAt: "asc" },
    });
  }
}

