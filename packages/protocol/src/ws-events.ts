/**
 * Runtime Core WebSocket 事件协议定义
 *
 * 所属模块：
 * * protocol
 *
 * 文件作用：
 * * 定义客户端与主程序之间的 WebSocket 事件类型
 * * 保证外部实时协议有明确且可检查的类型边界
 *
 * 主要功能：
 * * 定义客户端输入事件
 * * 定义服务端输出事件
 * * 聚合导出统一事件联合类型
 *
 * 依赖：
 * * 无运行时依赖，仅类型定义
 *
 * 注意事项：
 * * 该文件只描述外部 WS 协议，不直接复用内部 agent runtime 事件
 */

/**
 * 消息输入对象
 *
 * 功能说明：
 * * 承载客户端发送给运行时的最小输入载荷
 */
export interface ClientMessageInput {
  type: "text";
  text: string;
}

/**
 * 运行选项对象
 *
 * 功能说明：
 * * 声明是否流式输出、超时时间和目标 agent
 */
export interface ClientRunOptions {
  stream: boolean;
  timeoutMs: number;
  agentId: string;
}

/**
 * 客户端创建消息事件
 *
 * 功能说明：
 * * 请求主程序创建新 run 并进入调度流程
 */
export interface ClientMessageCreateEvent {
  event: "message.create";
  sessionId: string;
  messageId: string;
  input: ClientMessageInput;
  options: ClientRunOptions;
}

/**
 * 客户端取消运行事件
 *
 * 功能说明：
 * * 请求取消指定 run
 */
export interface ClientRunCancelEvent {
  event: "run.cancel";
  sessionId: string;
  runId: string;
  reason?: string;
}

/**
 * 客户端心跳事件
 *
 * 功能说明：
 * * 用于保活连接
 */
export interface ClientPingEvent {
  event: "ping";
  ts: string;
}

/**
 * 服务端会话就绪事件
 *
 * 功能说明：
 * * 在连接建立后告知客户端当前会话信息
 */
export interface ServerSessionReadyEvent {
  event: "session.ready";
  sessionId: string;
  userId: string;
  connectionId: string;
}

/**
 * 服务端运行开始事件
 *
 * 功能说明：
 * * 告知客户端 run 已创建并进入调度
 */
export interface ServerRunStartedEvent {
  event: "run.started";
  sessionId: string;
  runId: string;
  agentId: string;
  status: "created" | "queued" | "dispatching" | "running";
}

/**
 * 服务端消息增量事件
 *
 * 功能说明：
 * * 传递流式文本增量
 */
export interface ServerMessageDeltaEvent {
  event: "message.delta";
  sessionId: string;
  runId: string;
  delta: string;
}

/**
 * 服务端工具调用事件
 *
 * 功能说明：
 * * 向客户端展示当前 run 的工具调用信息
 */
export interface ServerRunToolCallEvent {
  event: "run.tool_call";
  sessionId: string;
  runId: string;
  toolName: string;
  toolCallId: string;
  args: unknown;
}

/**
 * 服务端运行完成事件
 *
 * 功能说明：
 * * 告知客户端 run 正常结束
 */
export interface ServerRunCompletedEvent {
  event: "run.completed";
  sessionId: string;
  runId: string;
  outputText?: string;
}

/**
 * 服务端运行失败事件
 *
 * 功能说明：
 * * 告知客户端 run 失败及错误信息
 */
export interface ServerRunFailedEvent {
  event: "run.failed";
  sessionId: string;
  runId: string;
  code: string;
  message: string;
}

/**
 * 服务端心跳回应事件
 *
 * 功能说明：
 * * 对 ping 事件进行回执
 */
export interface ServerPongEvent {
  event: "pong";
  ts: string;
}

/**
 * 客户端 WebSocket 事件联合类型
 */
export type ClientWsEvent =
  | ClientMessageCreateEvent
  | ClientRunCancelEvent
  | ClientPingEvent;

/**
 * 服务端 WebSocket 事件联合类型
 */
export type ServerWsEvent =
  | ServerSessionReadyEvent
  | ServerRunStartedEvent
  | ServerMessageDeltaEvent
  | ServerRunToolCallEvent
  | ServerRunCompletedEvent
  | ServerRunFailedEvent
  | ServerPongEvent;
