/**
 * User Meta 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 user_metadata_records 表读写能力
 */

import type { Prisma, UserMetadataRecord } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class UserMetaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertMany(items: Prisma.UserMetadataRecordCreateInput[]): Promise<UserMetadataRecord[]> {
    const results: UserMetadataRecord[] = [];
    for (const item of items) {
      results.push(
        await this.prisma.userMetadataRecord.upsert({
          where: {
            userId_key: {
              userId: item.userId,
              key: item.key,
            },
          },
          create: item,
          update: {
            valueJson: item.valueJson,
            confidence: item.confidence ?? null,
            tagsJson: item.tagsJson ?? undefined,
          },
        }),
      );
    }
    return results;
  }

  async findByUserIdAndKeys(userId: string, keys?: string[]): Promise<UserMetadataRecord[]> {
    return this.prisma.userMetadataRecord.findMany({
      where: {
        userId,
        key: keys && keys.length > 0 ? { in: keys } : undefined,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async listByUserId(userId: string): Promise<UserMetadataRecord[]> {
    return this.prisma.userMetadataRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
}
