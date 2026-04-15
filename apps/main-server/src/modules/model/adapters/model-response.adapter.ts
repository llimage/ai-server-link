/**
 * Model 响应适配器
 *
 * 所属模块：
 * * main-server/modules/model
 *
 * 文件作用：
 * * 将 model-core 响应适配为 internal API 稳定响应结构
 *
 * 主要功能：
 * * toModelInvokeData
 *
 * 依赖：
 * * protocol
 * * 尝试汇总策略
 *
 * 注意事项：
 * * 仅做结构适配，不更改事件语义
 */

import type { ModelInvokeResponse } from "protocol";
import { summarizeAttempts } from "../policies/model-attempts.policy";

/**
 * internal invoke 数据结构
 */
export interface ModelInvokeResponseData {
  modelId: string;
  events: ModelInvokeResponse["events"];
  attempts: ModelInvokeResponse["attempts"];
  attemptsSummary: ReturnType<typeof summarizeAttempts>;
}

/**
 * 适配 model-core invoke 响应
 *
 * @param response model-core 响应
 * @returns internal API 响应数据
 */
export function toModelInvokeData(
  response: ModelInvokeResponse,
): ModelInvokeResponseData {
  return {
    modelId: response.modelId,
    events: response.events,
    attempts: response.attempts,
    attemptsSummary: summarizeAttempts(response.attempts),
  };
}

