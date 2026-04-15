/**
 * Model 尝试记录策略
 *
 * 所属模块：
 * * main-server/modules/model
 *
 * 文件作用：
 * * 统一整理 model invoke attempts 输出，供 API 响应使用
 *
 * 主要功能：
 * * summarizeAttempts
 *
 * 依赖：
 * * protocol 类型
 *
 * 注意事项：
 * * 仅做展示层摘要，不改变 model-core 的 attempts 原始数据
 */

import type { ModelInvokeResponse } from "protocol";

/**
 * 尝试摘要结构
 */
export interface ModelAttemptsSummary {
  total: number;
  failed: number;
  succeededModelId?: string;
}

/**
 * 汇总 attempts 信息
 *
 * @param attempts model-core 返回的 attempts
 * @returns attempts 摘要
 */
export function summarizeAttempts(
  attempts: ModelInvokeResponse["attempts"],
): ModelAttemptsSummary {
  const succeeded = attempts.find((item) => item.success);
  return {
    total: attempts.length,
    failed: attempts.filter((item) => !item.success).length,
    succeededModelId: succeeded?.modelId,
  };
}

