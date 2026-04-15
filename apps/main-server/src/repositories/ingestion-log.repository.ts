/**
 * Ingestion Log 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 ingestion_logs 表读写
 *
 * 主要功能：
 * * create
 *
 * 依赖：
 * * PrismaService：数据库访问
 *
 * 注意事项：
 * * 日志记录只追加，不修改
 */

import type { IngestionLog, Prisma } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class IngestionLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 写入日志
   *
   * 功能说明：
   * 将 ingestion 阶段日志写入数据库
   *
   * @param data 日志数据
   * @returns 写入后的日志记录
   */
  async create(data: Prisma.IngestionLogCreateInput): Promise<IngestionLog> {
    return this.prisma.ingestionLog.create({ data });
  }
}
