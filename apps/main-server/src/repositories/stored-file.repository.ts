/**
 * Stored File 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 stored_files 表读写能力
 */

import type { Prisma, StoredFile } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class StoredFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createStoredFile(data: Prisma.StoredFileCreateInput): Promise<StoredFile> {
    return this.prisma.storedFile.create({ data });
  }

  async getByBucketAndObjectKey(bucket: string, objectKey: string): Promise<StoredFile | null> {
    return this.prisma.storedFile.findUnique({
      where: {
        bucket_objectKey: {
          bucket,
          objectKey,
        },
      },
    });
  }

  async getById(id: string): Promise<StoredFile | null> {
    return this.prisma.storedFile.findUnique({ where: { id } });
  }
}

