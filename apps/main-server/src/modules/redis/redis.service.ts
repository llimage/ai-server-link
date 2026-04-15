/**
 * Redis 服务封装
 *
 * 所属模块：
 * * main-server/modules/redis
 *
 * 文件作用：
 * * 提供最小 get/set/del 接口
 * * 统一缓存 key 规则，供 runtime-cache 等模块复用
 *
 * 主要功能：
 * * get
 * * set
 * * del
 * * buildKey
 *
 * 依赖：
 * * 当前阶段采用内存实现（Map）
 *
 * 注意事项：
 * * TODO 后续替换为真实 Redis 客户端接入
 */

/**
 * Redis 服务
 */
export class RedisService {
  private readonly storage = new Map<string, string>();

  /**
   * 读取缓存值
   *
   * @param key 缓存键
   * @returns 缓存值，不存在返回 null
   */
  async get(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  /**
   * 写入缓存值
   *
   * @param key 缓存键
   * @param value 缓存值
   * @param ttlSeconds 过期秒数（当前内存实现暂不主动过期）
   * @returns void
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.storage.set(key, value);
    void ttlSeconds;
  }

  /**
   * 删除缓存值
   *
   * @param key 缓存键
   * @returns void
   */
  async del(key: string): Promise<void> {
    this.storage.delete(key);
  }

  /**
   * 构建缓存键
   *
   * @param prefix 前缀
   * @param id 主键标识
   * @returns 规范化缓存键
   */
  buildKey(prefix: string, id: string): string {
    return `${prefix}:${id}`;
  }
}

