/**
 * Search Retrieval Log 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 retrieval_logs 表读写
 * * 提供 search.query 的检索日志持久化能力
 *
 * 主要功能：
 * * createLog
 *
 * 依赖：
 * * PrismaService：数据库访问
 *
 * 注意事项：
 * * 仅做持久化，不承担业务编排
 */

import type { Prisma, RetrievalLog } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class RetrievalLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 写入检索日志
   *
   * 功能说明：
   * 将 search.query 产生的日志写入数据库
   *
   * @param data 日志数据
   * @returns 已写入日志记录
   */
  async createLog(data: Prisma.RetrievalLogCreateInput): Promise<RetrievalLog> {
    return this.prisma.retrievalLog.create({ data });
  }
}
