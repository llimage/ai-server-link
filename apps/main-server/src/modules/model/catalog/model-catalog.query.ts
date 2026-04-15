/**
 * Model Catalog 查询转换器
 *
 * 所属模块：
 * * main-server/modules/model
 *
 * 文件作用：
 * * 将 HTTP query 转为 catalog filter 输入
 *
 * 主要功能：
 * * toCatalogFilter
 *
 * 依赖：
 * * model-core 类型
 *
 * 注意事项：
 * * 仅做轻量转换，复杂策略仍由 model-core 处理
 */

import type { ModelFilter } from "model-core";

/**
 * 将 query 映射为 catalog filter
 *
 * @param query 路由 query
 * @returns model filter
 */
export function toCatalogFilter(query: Record<string, unknown>): ModelFilter {
  return {
    family: typeof query.family === "string" ? query.family : undefined,
    supportsTools:
      typeof query.supportsTools === "boolean"
        ? query.supportsTools
        : undefined,
    supportsStreaming:
      typeof query.supportsStreaming === "boolean"
        ? query.supportsStreaming
        : undefined,
    supportsJson:
      typeof query.supportsJson === "boolean" ? query.supportsJson : undefined,
    latencyTier:
      query.latencyTier === "fast" ||
      query.latencyTier === "balanced" ||
      query.latencyTier === "slow"
        ? query.latencyTier
        : undefined,
    priority:
      query.priority === "low" ||
      query.priority === "normal" ||
      query.priority === "high"
        ? query.priority
        : undefined,
  };
}

