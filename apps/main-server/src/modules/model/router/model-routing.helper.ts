/**
 * Model 路由偏好辅助函数
 *
 * 所属模块：
 * * main-server/modules/model
 *
 * 文件作用：
 * * 将 invoke DTO 中的选模偏好提取为可复用结构
 *
 * 主要功能：
 * * pickRoutingPreference
 *
 * 依赖：
 * * protocol
 *
 * 注意事项：
 * * 该函数只做字段投影，不做策略决策
 */

import type { ModelInvokeRequest, ModelRoutingPreference } from "protocol";

/**
 * 提取选模偏好字段
 *
 * @param request 模型调用请求
 * @returns 选模偏好
 */
export function pickRoutingPreference(
  request: ModelInvokeRequest,
): ModelRoutingPreference {
  return {
    preferredModelId: request.preferredModelId ?? request.modelId,
    requiresTools: request.requiresTools,
    requiresStreaming: request.requiresStreaming,
    requiresJson: request.requiresJson,
    latencyTier: request.latencyTier,
    priority: request.priority,
  };
}

