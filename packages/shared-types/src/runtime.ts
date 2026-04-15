/**
 * Runtime 共享类型
 *
 * 所属模块：
 * * shared-types
 *
 * 文件作用：
 * * 定义 run 与 run event 的持久化结构
 */

export interface RunEntity {
  id: string;
  sessionId: string;
  userId?: string;
  status: string;
  inputText?: string;
  timeoutMs: number;
  createdAt: string;
  updatedAt: string;
}

export interface RunEventEntity {
  id: string;
  runId: string;
  eventType: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

