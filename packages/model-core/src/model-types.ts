/**
 * 模型核心类型定义
 *
 * 所属模块：
 * * model-core
 *
 * 文件作用：
 * * 定义 model-core 内部通用类型
 * * 抽象 provider 调用输入输出结构
 *
 * 主要功能：
 * * PublicModelSpec
 * * ProviderInvokeParams
 * * ProviderInvokeResult
 *
 * 依赖：
 * * protocol model 协议
 *
 * 注意事项：
 * * PublicModelSpec 仅包含可公开字段，不携带任何 secret
 */

import type {
  ModelDescriptor,
  ModelInvokeMessage,
  ModelRoutingPreference,
  ModelSelectionResult,
  ModelStreamEvent,
} from "protocol";

/**
 * 公共模型规格
 */
export type PublicModelSpec = ModelDescriptor;

/**
 * 选模过滤条件
 */
export type ModelFilter = Partial<
  Pick<
    PublicModelSpec,
    | "family"
    | "supportsTools"
    | "supportsStreaming"
    | "supportsJson"
    | "latencyTier"
    | "priority"
  >
>;

/**
 * Provider 调用参数
 */
export interface ProviderInvokeParams {
  runId: string;
  sessionId: string;
  userId: string;
  model: PublicModelSpec;
  messages: ModelInvokeMessage[];
  stream: boolean;
  timeoutMs: number;
  metadata?: Record<string, unknown>;
}

/**
 * Provider 调用结果
 */
export interface ProviderInvokeResult {
  events: ModelStreamEvent[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * 调用尝试记录
 */
export interface InvokeAttemptRecord {
  modelId: string;
  attempt: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * 模型选择参数
 */
export interface ModelSelectionInput extends ModelRoutingPreference {
  modelId?: string;
  preferredModelId?: string;
}

/**
 * 模型路由结果类型
 */
export type RoutingResult = ModelSelectionResult;
