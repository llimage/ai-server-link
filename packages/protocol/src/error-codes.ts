/**
 * Runtime Core 错误码定义
 *
 * 所属模块：
 * * protocol
 *
 * 文件作用：
 * * 统一运行时核心错误码常量
 *
 * 主要功能：
 * * 暴露会话、运行、调度、负载校验相关错误码
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 新增错误码时应保持向后兼容
 */

export const ERROR_CODES = {
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  SESSION_CLOSED: "SESSION_CLOSED",
  ACTIVE_RUN_EXISTS: "ACTIVE_RUN_EXISTS",
  RUN_NOT_FOUND: "RUN_NOT_FOUND",
  RUN_DISPATCH_FAILED: "RUN_DISPATCH_FAILED",
  RUN_TIMEOUT: "RUN_TIMEOUT",
  RUN_CANCELLED: "RUN_CANCELLED",
  AGENT_UNAVAILABLE: "AGENT_UNAVAILABLE",
  INVALID_EVENT_PAYLOAD: "INVALID_EVENT_PAYLOAD",
} as const;

export type RuntimeErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
