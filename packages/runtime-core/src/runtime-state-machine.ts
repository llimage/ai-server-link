/**
 * Runtime Core 状态机辅助函数
 *
 * 所属模块：
 * * runtime-core
 *
 * 文件作用：
 * * 提供 session 与 run 的状态跳转校验
 * * 提供终态判断辅助能力
 *
 * 主要功能：
 * * assertValidSessionTransition
 * * assertValidRunTransition
 * * isTerminalRunStatus
 *
 * 依赖：
 * * runtime-errors
 * * session/run 类型
 *
 * 注意事项：
 * * 非法状态转换必须抛错，避免静默数据污染
 */

import { ERROR_CODES } from "protocol";
import type { RunStatus } from "./run";
import type { SessionStatus } from "./session";
import { createRuntimeError } from "./runtime-errors";

const SESSION_TRANSITION_MAP: Record<SessionStatus, SessionStatus[]> = {
  active: ["idle", "closed"],
  idle: ["active", "closed"],
  closed: [],
};

const RUN_TRANSITION_MAP: Record<RunStatus, RunStatus[]> = {
  created: ["queued", "dispatching", "cancelled", "failed"],
  queued: ["dispatching", "cancelled", "failed", "timeout"],
  dispatching: ["running", "failed", "cancelled", "timeout"],
  running: ["completed", "failed", "cancelled", "timeout"],
  completed: [],
  failed: [],
  cancelled: [],
  timeout: [],
};

/**
 * 校验 session 状态跳转是否合法
 *
 * 功能说明：
 * * 根据允许映射校验 from 到 to 是否可转移
 *
 * @param from 当前状态
 * @param to 目标状态
 * @throws RuntimeError 非法跳转时抛出
 */
export function assertValidSessionTransition(
  from: SessionStatus,
  to: SessionStatus,
): void {
  if (from === to) {
    return;
  }

  if (!SESSION_TRANSITION_MAP[from].includes(to)) {
    throw createRuntimeError(
      ERROR_CODES.INVALID_EVENT_PAYLOAD,
      `Invalid session transition: ${from} -> ${to}`,
      { from, to },
    );
  }
}

/**
 * 校验 run 状态跳转是否合法
 *
 * 功能说明：
 * * 根据允许映射校验 run 的状态迁移
 *
 * @param from 当前状态
 * @param to 目标状态
 * @throws RuntimeError 非法跳转时抛出
 */
export function assertValidRunTransition(from: RunStatus, to: RunStatus): void {
  if (from === to) {
    return;
  }

  if (isTerminalRunStatus(from) && !isTerminalRunStatus(to)) {
    throw createRuntimeError(
      ERROR_CODES.INVALID_EVENT_PAYLOAD,
      `Terminal run status cannot transition: ${from} -> ${to}`,
      { from, to },
    );
  }

  if (!RUN_TRANSITION_MAP[from].includes(to)) {
    throw createRuntimeError(
      ERROR_CODES.INVALID_EVENT_PAYLOAD,
      `Invalid run transition: ${from} -> ${to}`,
      { from, to },
    );
  }
}

/**
 * 判断 run 状态是否终态
 *
 * 功能说明：
 * * 终态包括 completed、failed、cancelled、timeout
 *
 * @param status 运行状态
 * @returns 是否终态
 */
export function isTerminalRunStatus(status: RunStatus): boolean {
  return (
    status === "completed" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "timeout"
  );
}
