/**
 * Runtime Core Run 类型定义
 *
 * 所属模块：
 * * runtime-core
 *
 * 文件作用：
 * * 定义 run 的输入、状态与实体结构
 * * 作为调度与执行流程的统一运行数据模型
 *
 * 主要功能：
 * * 定义 RunStatus
 * * 定义 RunInput
 * * 定义 Run 实体
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 终态后不应再回退到非终态
 */

/**
 * 运行状态
 */
export type RunStatus =
  | "created"
  | "queued"
  | "dispatching"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "timeout";

/**
 * 运行输入
 */
export interface RunInput {
  type: "text";
  text: string;
}

/**
 * 运行对象
 */
export interface Run {
  runId: string;
  sessionId: string;
  userId: string;
  agentId: string;
  status: RunStatus;
  input: RunInput;
  timeoutMs: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}
