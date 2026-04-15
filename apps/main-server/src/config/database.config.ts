/**
 * 数据库配置读取器
 *
 * 所属模块：
 * * main-server/config
 *
 * 文件作用：
 * * 统一读取 DATABASE_URL 并执行最小校验
 * * 避免数据库连接配置散落在业务代码中
 *
 * 主要功能：
 * * getDatabaseConfig
 *
 * 依赖：
 * * process.env
 *
 * 注意事项：
 * * 缺失 DATABASE_URL 时直接抛错，避免服务在未知状态启动
 */

/**
 * 数据库配置结构
 */
export interface DatabaseConfig {
  databaseUrl: string;
}

/**
 * 读取数据库配置
 *
 * @returns 数据库配置
 * @throws Error 当 DATABASE_URL 缺失时抛出错误
 */
export function getDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  return { databaseUrl };
}

