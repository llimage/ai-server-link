/**
 * Runtime Core 内部 Agent 协议定义
 *
 * 所属模块：
 * * protocol
 *
 * 文件作用：
 * * 定义 main-server 与 agent-runtime 间的内部请求/响应结构
 * * 约束运行调度层与执行层的通信边界
 *
 * 主要功能：
 * * 定义 start run 请求与响应
 * * 定义 cancel 请求
 * * 定义事件回传请求
 * * 定义心跳请求
 *
 * 依赖：
 * * runtime-events：内部事件类型
 *
 * 注意事项：
 * * 协议中禁止出现 provider secret 和数据库连接配置
 */

import type { AgentRuntimeEvent } from "./runtime-events";

/**
 * 内部 Agent 运行请求
 */
export interface InternalAgentRunRequest {
  runId: string;
  sessionId: string;
  userId: string;
  agentId: string;
  timeoutMs: number;
  stream: boolean;
  input: {
    type: "text";
    text: string;
  };
}

/**
 * 内部 Agent 运行响应
 */
export interface InternalAgentRunResponse {
  accepted: boolean;
  runId: string;
  agentRuntimeId: string;
  message?: string;
}

/**
 * 内部 Agent 取消请求
 */
export interface InternalAgentCancelRequest {
  runId: string;
  sessionId: string;
  userId: string;
  agentId: string;
  reason?: string;
}

/**
 * 内部 Runtime 事件回传请求
 */
export interface InternalRuntimeEventsRequest {
  runId: string;
  sessionId: string;
  events: AgentRuntimeEvent[];
}

/**
 * 内部 Agent 心跳请求
 */
export interface InternalAgentHeartbeatRequest {
  agentRuntimeId: string;
  agentId: string;
  status: "healthy" | "busy" | "unhealthy";
  activeRuns: number;
  ts: string;
}
