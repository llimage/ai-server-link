/**
 * Tool Core 工具定义模型
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 定义内置工具注册与执行的最小通用结构
 *
 * 主要功能：
 * * ToolDefinition 接口
 * * ToolExecuteRequest / ToolExecuteResponse
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 当前结构为最小可用模型，后续可扩展更严格 schema
 */

/**
 * 工具定义
 */
export interface ToolDefinition {
  name: string;
  visibility: "agent" | "internal";
  sideEffect: boolean;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  execute(args: unknown): Promise<unknown>;
}

/**
 * 工具执行请求
 */
export interface ToolExecuteRequest {
  name: string;
  args: unknown;
}

/**
 * 工具执行响应
 */
export interface ToolExecuteResponse {
  ok: boolean;
  result?: unknown;
  error?: string;
}

