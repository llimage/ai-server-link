/**
 * Prisma 数据库服务
 *
 * 所属模块：
 * * main-server/modules/database
 *
 * 文件作用：
 * * 封装 PrismaClient 生命周期与健康检查能力
 * * 作为 repository 层统一数据库入口
 *
 * 主要功能：
 * * connect
 * * disconnect
 * * healthcheck
 *
 * 依赖：
 * * @prisma/client
 *
 * 注意事项：
 * * 服务启动阶段应显式 connect，关闭阶段应显式 disconnect
 */

import { PrismaClient } from "@prisma/client";

/**
 * Prisma 服务
 */
export class PrismaService extends PrismaClient {
  /**
   * 建立数据库连接
   *
   * @returns void
   */
  async connect(): Promise<void> {
    await this.$connect();
  }

  /**
   * 关闭数据库连接
   *
   * @returns void
   */
  async disconnect(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * 执行数据库健康检查
   *
   * @returns 健康检查结果
   * @throws Error 当数据库不可用时抛出错误
   */
  async healthcheck(): Promise<{ ok: true }> {
    await this.$queryRaw`SELECT 1`;
    return { ok: true };
  }
}

