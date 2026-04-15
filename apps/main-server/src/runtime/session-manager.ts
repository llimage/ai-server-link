/**
 * Runtime Core 会话管理服务
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 封装 session 生命周期管理，隔离 ws 层与存储层
 * * 提供创建、绑定连接、解绑、空闲、关闭能力
 *
 * 主要功能：
 * * createSession
 * * getSession
 * * bindConnection
 * * unbindConnection
 * * markIdle
 * * closeSession
 *
 * 依赖：
 * * runtime-core SessionStore
 * * runtime-core 状态机校验函数
 *
 * 注意事项：
 * * 断开连接时只标记 idle，不直接删除，支持会话恢复
 */

import { randomUUID } from "node:crypto";
import {
  assertValidSessionTransition,
  type Session,
  type SessionStatus,
  type SessionStore,
} from "runtime-core";
import { ERROR_CODES } from "protocol";
import { createRuntimeError } from "runtime-core";

/**
 * 会话管理器
 *
 * 功能说明：
 * * 管理逻辑会话状态流转与连接绑定
 */
export class SessionManager {
  /**
   * 构造会话管理器
   *
   * @param sessionStore 会话存储
   */
  constructor(private readonly sessionStore: SessionStore) {}

  /**
   * 创建会话
   *
   * 功能说明：
   * * 为用户创建新的逻辑会话，并可选绑定连接
   *
   * @param userId 用户 ID
   * @param connectionId 连接 ID，可选
   * @returns 新建的会话对象
   */
  async createSession(userId: string, connectionId?: string): Promise<Session> {
    const now = new Date().toISOString();
    const session: Session = {
      sessionId: `sess_${randomUUID()}`,
      userId,
      connectionId,
      status: connectionId ? "active" : "idle",
      createdAt: now,
      updatedAt: now,
    };
    await this.sessionStore.set(session);
    return session;
  }

  /**
   * 获取会话
   *
   * 功能说明：
   * * 通过 sessionId 查询会话
   *
   * @param sessionId 会话 ID
   * @returns 会话对象或 null
   */
  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessionStore.get(sessionId);
  }

  /**
   * 绑定连接
   *
   * 功能说明：
   * * 将连接绑定到指定会话并切换到 active
   *
   * @param sessionId 会话 ID
   * @param connectionId 连接 ID
   * @returns 更新后的会话
   *
   * @throws RuntimeError 当会话不存在或已关闭
   */
  async bindConnection(
    sessionId: string,
    connectionId: string,
  ): Promise<Session> {
    const session = await this.mustGetSession(sessionId);
    if (session.status === "closed") {
      throw createRuntimeError(
        ERROR_CODES.SESSION_CLOSED,
        "Session is already closed",
        { sessionId },
      );
    }
    this.transition(session, "active");
    session.connectionId = connectionId;
    await this.sessionStore.set(session);
    return session;
  }

  /**
   * 解绑连接
   *
   * 功能说明：
   * * 清除会话上的 connectionId，并将状态标记为 idle
   *
   * @param sessionId 会话 ID
   * @returns 更新后的会话
   *
   * @throws RuntimeError 当会话不存在
   */
  async unbindConnection(sessionId: string): Promise<Session> {
    const session = await this.mustGetSession(sessionId);
    if (session.status === "active") {
      this.transition(session, "idle");
    }
    session.connectionId = undefined;
    await this.sessionStore.set(session);
    return session;
  }

  /**
   * 标记会话空闲
   *
   * 功能说明：
   * * 将会话状态从 active 切换为 idle
   *
   * @param sessionId 会话 ID
   * @returns 更新后的会话
   */
  async markIdle(sessionId: string): Promise<Session> {
    const session = await this.mustGetSession(sessionId);
    if (session.status === "active") {
      this.transition(session, "idle");
      await this.sessionStore.set(session);
    }
    return session;
  }

  /**
   * 关闭会话
   *
   * 功能说明：
   * * 将会话状态标记为 closed 并解除连接绑定
   *
   * @param sessionId 会话 ID
   * @returns 更新后的会话
   */
  async closeSession(sessionId: string): Promise<Session> {
    const session = await this.mustGetSession(sessionId);
    if (session.status !== "closed") {
      this.transition(session, "closed");
      session.connectionId = undefined;
      await this.sessionStore.set(session);
    }
    return session;
  }

  /**
   * 必须获取会话
   *
   * 功能说明：
   * * 查询会话，不存在时抛出统一错误
   *
   * @param sessionId 会话 ID
   * @returns 会话对象
   *
   * @throws RuntimeError 当会话不存在
   */
  private async mustGetSession(sessionId: string): Promise<Session> {
    const session = await this.sessionStore.get(sessionId);
    if (!session) {
      throw createRuntimeError(
        ERROR_CODES.SESSION_NOT_FOUND,
        "Session not found",
        { sessionId },
      );
    }
    return session;
  }

  /**
   * 执行状态流转
   *
   * 功能说明：
   * * 校验并更新会话状态
   *
   * @param session 会话对象
   * @param to 目标状态
   * @returns void
   */
  private transition(session: Session, to: SessionStatus): void {
    assertValidSessionTransition(session.status, to);
    session.status = to;
    session.updatedAt = new Date().toISOString();
  }
}

