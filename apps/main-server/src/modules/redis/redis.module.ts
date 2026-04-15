/**
 * Redis 模块封装
 *
 * 所属模块：
 * * main-server/modules/redis
 *
 * 文件作用：
 * * 提供 RedisService 单例创建入口
 *
 * 主要功能：
 * * createRedisModule
 *
 * 依赖：
 * * redis.service
 *
 * 注意事项：
 * * 当前阶段使用内存版服务，后续可替换为真实 Redis 客户端
 */

import { RedisService } from "./redis.service";

/**
 * Redis 模块对象
 */
export interface RedisModule {
  redis: RedisService;
}

/**
 * 创建 Redis 模块
 *
 * @returns Redis 模块
 */
export function createRedisModule(): RedisModule {
  return {
    redis: new RedisService(),
  };
}

