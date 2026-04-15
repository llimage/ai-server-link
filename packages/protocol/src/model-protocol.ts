/**
 * 模型协议类型导出
 *
 * 所属模块：
 * * protocol
 *
 * 文件作用：
 * * 复用 shared-types 中的模型共享类型
 * * 为各服务提供统一协议入口
 *
 * 主要功能：
 * * 导出 ModelDescriptor / ModelInvokeRequest / ModelInvokeResponse / ModelStreamEvent
 *
 * 依赖：
 * * shared-types/model
 *
 * 注意事项：
 * * 协议层只暴露公开类型，不包含 provider secret
 */

import type {
  ModelDescriptor,
  ModelInvokeMessage,
  ModelInvokeRequest,
  ModelInvokeResponse,
  ModelLatencyTier,
  ModelMessageRole,
  ModelPriorityTier,
  ModelRoutingPreference,
  ModelSelectionResult,
  ModelStreamEvent,
} from "shared-types";

/**
 * 公共模型目录项
 */
export type ModelCatalogItem = ModelDescriptor;

export type {
  ModelDescriptor,
  ModelInvokeMessage,
  ModelInvokeRequest,
  ModelInvokeResponse,
  ModelLatencyTier,
  ModelMessageRole,
  ModelPriorityTier,
  ModelRoutingPreference,
  ModelSelectionResult,
  ModelStreamEvent,
};
