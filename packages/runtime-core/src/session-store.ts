/**
 * Runtime Core Session Store 定义
 *
 * 所属模块：
 * * runtime-core
 *
 * 文件作用：
 * * 定义 session 存储接口
 * * 提供内存版 session 存储实现
 *
 * 主要功能：
 * * get/set/delete
 * * 可选 list
 *
 * 依赖：
 * * session 类型
 *
 * 注意事项：
 * * // TODO: replace in-memory store with persistent store in storage phase
 */

import type { Session } from "./session";

/**
 * Session 存储接口
 */
export interface SessionStore {
  get(sessionId: string): Promise<Session | null>;
  set(session: Session): Promise<void>;
  delete(sessionId: string): Promise<void>;
  list?(): Promise<Session[]>;
}

/**
 * 内存版 Session Store
 */
export class InMemorySessionStore implements SessionStore {
  // TODO: replace in-memory store with persistent store in storage phase
  private readonly store = new Map<string, Session>();

  /**
   * 读取 session
   *
   * 功能说明：
   * * 按 sessionId 返回会话对象
   *
   * @param sessionId 会话 ID
   * @returns Session 或 null
   */
  async get(sessionId: string): Promise<Session | null> {
    return this.store.get(sessionId) ?? null;
  }

  /**
   * 写入 session
   *
   * 功能说明：
   * * 覆盖保存会话对象
   *
   * @param session 会话对象
   * @returns void
   */
  async set(session: Session): Promise<void> {
    this.store.set(session.sessionId, session);
  }

  /**
   * 删除 session
   *
   * 功能说明：
   * * 按 sessionId 删除会话
   *
   * @param sessionId 会话 ID
   * @returns void
   */
  async delete(sessionId: string): Promise<void> {
    this.store.delete(sessionId);
  }

  /**
   * 列出所有 session
   *
   * 功能说明：
   * * 返回当前内存中的全部会话
   *
   * @returns 会话列表
   */
  async list(): Promise<Session[]> {
    return [...this.store.values()];
  }
}
