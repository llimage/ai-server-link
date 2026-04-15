/**
 * Search Core 过滤条件归一化
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 对 filters 做最小清洗与统一结构转换
 *
 * 主要功能：
 * * undefined 转空对象
 * * 删除 undefined 值
 * * 拒绝函数值
 *
 * 依赖：
 * * search-types
 *
 * 注意事项：
 * * 不在此处实现鉴权与行业字段绑定
 */

import type { NormalizedFilters } from "./search-types";

/**
 * 归一化过滤条件
 *
 * 功能说明：
 * * 清理非法值并保持通用键值结构
 *
 * @param filters 原始过滤条件
 * @returns 归一化过滤对象
 *
 * @throws Error 当存在函数类型的过滤值
 */
export function normalizeFilters(
  filters?: Record<string, unknown>,
): NormalizedFilters {
  if (!filters) {
    return { values: {} };
  }

  const values: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === "undefined") {
      continue;
    }
    if (typeof value === "function") {
      throw new Error(`Invalid filter value for key: ${key}`);
    }
    values[key] = value;
  }
  return { values };
}

