/**
 * 持久化测试工具
 *
 * 所属模块：
 * * main-server/tests
 *
 * 文件作用：
 * * 为持久化测试提供 DATABASE_URL 检查与 PrismaService 创建能力
 */

import { PrismaService } from "../modules/database/prisma.service";

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function withPrisma<T>(
  fn: (prisma: PrismaService) => Promise<T>,
): Promise<T> {
  const prisma = new PrismaService();
  await prisma.connect();
  try {
    return await fn(prisma);
  } finally {
    await prisma.disconnect();
  }
}

