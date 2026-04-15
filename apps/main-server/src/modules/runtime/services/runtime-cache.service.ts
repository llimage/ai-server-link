/**
 * Runtime 缓存服务
 *
 * 所属模块：
 * * main-server/modules/runtime
 *
 * 文件作用：
 * * 维护 session/run 的短期缓存
 * * 统一 runtime 相关 key 命名规范
 *
 * 主要功能：
 * * setSessionCache/getSessionCache
 * * setRunCache/getRunCache
 * * setRunStatus/getRunStatus
 *
 * 依赖：
 * * RedisService
 *
 * 注意事项：
 * * 本阶段只做基础缓存，不实现 queue/reminder 能力
 */

import { RedisService } from "../../redis/redis.service";

/**
 * Runtime 缓存服务
 */
export class RuntimeCacheService {
  constructor(private readonly redis: RedisService) {}

  /**
   * 缓存 session 数据
   *
   * @param sessionId 会话 ID
   * @param payload 会话缓存内容
   * @returns void
   */
  async setSessionCache(sessionId: string, payload: unknown): Promise<void> {
    await this.redis.set(this.sessionKey(sessionId), JSON.stringify(payload), 3600);
  }

  /**
   * 读取 session 缓存
   *
   * @param sessionId 会话 ID
   * @returns 缓存对象，不存在返回 null
   */
  async getSessionCache<T>(sessionId: string): Promise<T | null> {
    const raw = await this.redis.get(this.sessionKey(sessionId));
    return raw ? (JSON.parse(raw) as T) : null;
  }

  /**
   * 缓存 run 数据
   *
   * @param runId run ID
   * @param payload run 缓存内容
   * @returns void
   */
  async setRunCache(runId: string, payload: unknown): Promise<void> {
    await this.redis.set(this.runKey(runId), JSON.stringify(payload), 3600);
  }

  /**
   * 读取 run 缓存
   *
   * @param runId run ID
   * @returns 缓存对象，不存在返回 null
   */
  async getRunCache<T>(runId: string): Promise<T | null> {
    const raw = await this.redis.get(this.runKey(runId));
    return raw ? (JSON.parse(raw) as T) : null;
  }

  /**
   * 写入 run 状态缓存
   *
   * @param runId run ID
   * @param status run 状态
   * @returns void
   */
  async setRunStatus(runId: string, status: string): Promise<void> {
    await this.redis.set(this.runStatusKey(runId), status, 3600);
  }

  /**
   * 读取 run 状态缓存
   *
   * @param runId run ID
   * @returns run 状态，不存在返回 null
   */
  async getRunStatus(runId: string): Promise<string | null> {
    return this.redis.get(this.runStatusKey(runId));
  }

  /**
   * 构建 session key
   *
   * @param sessionId 会话 ID
   * @returns key
   */
  private sessionKey(sessionId: string): string {
    return this.redis.buildKey("session", sessionId);
  }

  /**
   * 构建 run key
   *
   * @param runId run ID
   * @returns key
   */
  private runKey(runId: string): string {
    return this.redis.buildKey("run", runId);
  }

  /**
   * 构建 run status key
   *
   * @param runId run ID
   * @returns key
   */
  private runStatusKey(runId: string): string {
    return this.redis.buildKey("run:status", runId);
  }
}

