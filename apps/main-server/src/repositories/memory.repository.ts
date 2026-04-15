/**
 * Memory 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 memory_records 与 memory_summaries 表读写能力
 */

import type { MemoryRecord, MemorySummary, Prisma } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class MemoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMemory(data: Prisma.MemoryRecordCreateInput): Promise<MemoryRecord> {
    return this.prisma.memoryRecord.create({ data });
  }

  async searchByUserId(
    userId: string,
    query: string,
    tags?: string[],
    limit = 20,
  ): Promise<MemoryRecord[]> {
    const rows = await this.prisma.memoryRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit * 2,
    });
    return rows
      .filter((row) => {
        const hitQuery = row.content.toLowerCase().includes(query.toLowerCase());
        if (!tags || tags.length === 0) {
          return hitQuery;
        }
        const rowTags = Array.isArray(row.tagsJson) ? row.tagsJson : [];
        return hitQuery && tags.every((tag) => rowTags.includes(tag));
      })
      .slice(0, limit);
  }

  async createSummary(data: Prisma.MemorySummaryCreateInput): Promise<MemorySummary> {
    return this.prisma.memorySummary.create({ data });
  }

  async listSummariesByUserId(userId: string): Promise<MemorySummary[]> {
    return this.prisma.memorySummary.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}

