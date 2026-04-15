/**
 * Runtime Core 内部事件协议定义
 *
 * 所属模块：
 * * protocol
 *
 * 文件作用：
 * * 定义 agent-runtime 向 main-server 回传的内部事件类型
 * * 为 event-relay 提供稳定可判别的输入结构
 *
 * 主要功能：
 * * 定义 status 事件
 * * 定义 delta 事件
 * * 定义 tool_call/tool_result 事件
 * * 定义 done/error 事件
 *
 * 依赖：
 * * 无运行时依赖，仅类型定义
 *
 * 注意事项：
 * * 内部事件不应直接暴露给外部 WebSocket 客户端
 */

/**
 * 内部状态事件
 */
export interface AgentRuntimeStatusEvent {
  type: "status";
  status: "queued" | "thinking" | "running" | "tooling";
  ts: string;
}

/**
 * 内部文本增量事件
 */
export interface AgentRuntimeDeltaEvent {
  type: "delta";
  text: string;
  ts: string;
}

/**
 * 内部工具调用事件
 */
export interface AgentRuntimeToolCallEvent {
  type: "tool_call";
  toolName: string;
  toolCallId: string;
  args: unknown;
  ts: string;
}

/**
 * 内部工具结果事件
 */
export interface AgentRuntimeToolResultEvent {
  type: "tool_result";
  toolName: string;
  toolCallId: string;
  result: unknown;
  ts: string;
}

/**
 * 内部完成事件
 */
export interface AgentRuntimeDoneEvent {
  type: "done";
  outputText?: string;
  ts: string;
}

/**
 * 内部错误事件
 */
export interface AgentRuntimeErrorEvent {
  type: "error";
  code: string;
  message: string;
  ts: string;
}

/**
 * 内部 runtime 事件联合类型
 */
export type AgentRuntimeEvent =
  | AgentRuntimeStatusEvent
  | AgentRuntimeDeltaEvent
  | AgentRuntimeToolCallEvent
  | AgentRuntimeToolResultEvent
  | AgentRuntimeDoneEvent
  | AgentRuntimeErrorEvent;
