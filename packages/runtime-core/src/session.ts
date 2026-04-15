/**
 * Runtime Core Session 类型定义
 *
 * 所属模块：
 * * runtime-core
 *
 * 文件作用：
 * * 定义逻辑会话的数据结构
 * * 区分逻辑 session 与 WebSocket 连接
 *
 * 主要功能：
 * * 定义 SessionStatus
 * * 定义 Session 实体
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * session 是逻辑会话，不等同于传输层连接
 */

/**
 * 逻辑会话状态
 */
export type SessionStatus = "active" | "idle" | "closed";

/**
 * 逻辑会话对象
 */
export interface Session {
  sessionId: string;
  userId: string;
  connectionId?: string;
  status: SessionStatus;
  activeRunId?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}
