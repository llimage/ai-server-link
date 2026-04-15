/**
 * Memory Core 记忆搜索
 *
 * 所属模块：
 * * memory-core
 *
 * 文件作用：
 * * 提供记忆条目的朴素文本匹配搜索能力
 *
 * 主要功能：
 * * searchMemoryItems
 *
 * 依赖：
 * * protocol
 *
 * 注意事项：
 * * 当前为 contains/keyword 级别匹配，后续再接向量检索
 */

import type { MemoryItem } from "protocol";

/**
 * 搜索记忆条目
 *
 * @param items 记忆候选列表
 * @param query 查询文本
 * @param topK 返回数量
 * @returns 命中条目
 */
export function searchMemoryItems(
  items: MemoryItem[],
  query: string,
  topK: number,
): MemoryItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }
  const words = normalizedQuery.split(/\s+/).filter((word) => word.length > 0);
  const scored = items
    .map((item) => {
      const content = item.content.toLowerCase();
      let score = 0;
      for (const word of words) {
        if (content.includes(word)) {
          score += 1;
        }
      }
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return right.item.updatedAt.localeCompare(left.item.updatedAt);
    });

  // TODO: replace naive memory search with vectorized memory retrieval in memory ranking phase
  return scored.slice(0, Math.max(1, topK)).map((entry) => entry.item);
}

