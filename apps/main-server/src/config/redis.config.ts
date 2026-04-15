/**
 * Redis 配置读取器
 *
 * 所属模块：
 * * main-server/config
 *
 * 文件作用：
 * * 统一读取 REDIS_URL 配置
 *
 * 主要功能：
 * * getRedisConfig
 *
 * 依赖：
 * * process.env
 *
 * 注意事项：
 * * 本阶段仅做基础接入配置，不做队列扩展
 */

/**
 * Redis 配置结构
 */
export interface RedisConfig {
  redisUrl: string;
}

/**
 * 读取 Redis 配置
 *
 * @returns Redis 配置
 * @throws Error 当 REDIS_URL 缺失时抛出错误
 */
export function getRedisConfig(): RedisConfig {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is required");
  }
  return { redisUrl };
}

