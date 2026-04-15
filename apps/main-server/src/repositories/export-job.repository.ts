/**
 * Export Job 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 export_jobs 表读写能力
 */

import type { ExportJob, Prisma } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class ExportJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createExportJob(data: Prisma.ExportJobCreateInput): Promise<ExportJob> {
    return this.prisma.exportJob.create({ data });
  }

  async updateExportJobStatus(
    id: string,
    payload: {
      status: string;
      outputFileId?: string;
      errorMessage?: string;
    },
  ): Promise<ExportJob> {
    return this.prisma.exportJob.update({
      where: { id },
      data: payload,
    });
  }

  async getById(id: string): Promise<ExportJob | null> {
    return this.prisma.exportJob.findUnique({ where: { id } });
  }

  async listByUserId(userId: string): Promise<ExportJob[]> {
    return this.prisma.exportJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}

