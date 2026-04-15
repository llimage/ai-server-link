/**
 * Run 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 runs 表读写能力
 *
 * 主要功能：
 * * createRun
 * * updateRunStatus
 * * finishRun
 * * getRunById
 */

import type { Prisma, Run } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class RunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRun(data: Prisma.RunCreateInput): Promise<Run> {
    return this.prisma.run.create({ data });
  }

  async updateRunStatus(runId: string, status: string): Promise<Run> {
    return this.prisma.run.update({
      where: { id: runId },
      data: { status },
    });
  }

  async finishRun(runId: string, status: string): Promise<Run> {
    return this.prisma.run.update({
      where: { id: runId },
      data: {
        status,
        finishedAt: new Date(),
      },
    });
  }

  async getRunById(runId: string): Promise<Run | null> {
    return this.prisma.run.findUnique({ where: { id: runId } });
  }
}

