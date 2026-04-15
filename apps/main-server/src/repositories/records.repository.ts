/**
 * Records 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 records 表读写能力
 */

import type { Prisma, Record } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class RecordsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRecord(data: Prisma.RecordCreateInput): Promise<Record> {
    return this.prisma.record.create({ data });
  }

  async queryRecords(params: {
    userId: string;
    space?: string;
    type?: string;
    limit?: number;
  }): Promise<Record[]> {
    return this.prisma.record.findMany({
      where: {
        userId: params.userId,
        space: params.space,
        type: params.type,
      },
      orderBy: { updatedAt: "desc" },
      take: params.limit ?? 20,
    });
  }

  async updateRecord(
    recordId: string,
    patch: {
      payloadJson?: Prisma.InputJsonValue;
      metadataJson?: Prisma.InputJsonValue;
    },
  ): Promise<Record | null> {
    const existing = await this.prisma.record.findUnique({ where: { id: recordId } });
    if (!existing) {
      return null;
    }
    return this.prisma.record.update({
      where: { id: recordId },
      data: patch,
    });
  }
}
