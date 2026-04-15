/**
 * 共享模型类型定义
 *
 * 所属模块：
 * * shared-types
 *
 * 文件作用：
 * * 定义 Model Handler Core 在多模块共享的基础类型
 * * 避免 agent-runtime/main-server/model-core 各自重复定义
 *
 * 主要功能：
 * * ModelDescriptor
 * * ModelInvokeRequest / ModelInvokeResponse
 * * ModelStreamEvent
 * * ModelRoutingPreference / ModelSelectionResult
 *
 * 依赖：
 * * TypeScript 类型系统
 *
 * 注意事项：
 * * 共享类型仅包含公开字段，禁止包含 provider secret
 */

/**
 * 延迟分层
 */
export type ModelLatencyTier = "fast" | "balanced" | "slow";

/**
 * 优先级
 */
export type ModelPriorityTier = "low" | "normal" | "high";

/**
 * 统一消息角色
 */
export type ModelMessageRole = "system" | "user" | "assistant" | "tool";

/**
 * 模型描述符
 */
export interface ModelDescriptor {
  modelId: string;
  family: string;
  supportsTools: boolean;
  supportsStreaming: boolean;
  supportsJson: boolean;
  costTier: "low" | "mid" | "high";
  latencyTier: ModelLatencyTier;
  priority: ModelPriorityTier;
  maxContext?: number;
  tags?: string[];
}

/**
 * 调用消息
 */
export interface ModelInvokeMessage {
  role: ModelMessageRole;
  content: string;
}

/**
 * 选模偏好
 */
export interface ModelRoutingPreference {
  preferredModelId?: string;
  requiresTools?: boolean;
  requiresStreaming?: boolean;
  requiresJson?: boolean;
  latencyTier?: ModelLatencyTier;
  priority?: ModelPriorityTier;
}

/**
 * 模型调用请求
 */
export interface ModelInvokeRequest {
  runId: string;
  sessionId: string;
  userId: string;
  modelId?: string;
  preferredModelId?: string;
  messages: ModelInvokeMessage[];
  stream?: boolean;
  timeoutMs?: number;
  requiresTools?: boolean;
  requiresStreaming?: boolean;
  requiresJson?: boolean;
  latencyTier?: ModelLatencyTier;
  priority?: ModelPriorityTier;
  metadata?: Record<string, unknown>;
}

/**
 * 模型流式事件
 */
export type ModelStreamEvent =
  | { type: "delta"; text: string }
  | {
      type: "done";
      usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      };
    }
  | { type: "error"; code: string; message: string };

/**
 * 模型调用响应
 */
export interface ModelInvokeResponse {
  ok: true;
  modelId: string;
  events: ModelStreamEvent[];
  attempts: Array<{
    modelId: string;
    attempt: number;
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
  }>;
}

/**
 * 选模结果
 */
export interface ModelSelectionResult {
  primary: ModelDescriptor;
  fallbacks: ModelDescriptor[];
}
