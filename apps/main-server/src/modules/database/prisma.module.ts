/**
 * Prisma 模块封装
 *
 * 所属模块：
 * * main-server/modules/database
 *
 * 文件作用：
 * * 提供 PrismaService 单例创建入口
 * * 约束数据库服务实例管理方式
 *
 * 主要功能：
 * * createPrismaModule
 *
 * 依赖：
 * * prisma.service
 *
 * 注意事项：
 * * 当前项目未使用 Nest DI，此处采用轻量模块工厂模式
 */

import { PrismaService } from "./prisma.service";

/**
 * Prisma 模块对象
 */
export interface PrismaModule {
  prisma: PrismaService;
}

/**
 * 创建 Prisma 模块
 *
 * @returns Prisma 模块实例
 */
export function createPrismaModule(): PrismaModule {
  return {
    prisma: new PrismaService(),
  };
}

