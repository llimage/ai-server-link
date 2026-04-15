/**
 * Search Core 查询归一化
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 对用户查询文本做最小规范化处理
 *
 * 主要功能：
 * * trim
 * * collapse spaces
 * * 英文小写化
 *
 * 依赖：
 * * search-types
 *
 * 注意事项：
 * * 不引入行业词典与复杂 NLP 逻辑
 */

import type { NormalizedQuery } from "./search-types";

/**
 * 归一化查询文本
 *
 * 功能说明：
 * * 对原始文本进行裁剪、空白折叠与英文小写转换
 *
 * @param input 原始查询
 * @returns 归一化查询对象
 *
 * @throws Error 当归一化后为空字符串
 */
export function normalizeQuery(input: string): NormalizedQuery {
  const raw = input;
  const normalized = raw.trim().replace(/\s+/g, " ").toLowerCase();
  if (!normalized) {
    throw new Error("Query cannot be empty");
  }
  return {
    raw,
    normalized,
    tokens: normalized.split(" "),
  };
}

