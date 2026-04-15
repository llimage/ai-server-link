/**
 * Search Core 关键词检索适配器
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 定义关键词检索接口与当前批次 mock 实现
 *
 * 主要功能：
 * * KeywordSearchAdapter 接口
 * * MockKeywordSearchAdapter 实现
 *
 * 依赖：
 * * search-types
 * * score-utils
 *
 * 注意事项：
 * * 当前实现仅用于闭环验证，后续替换为真实 FTS/SQL 方案
 */

import { clampScore } from "./score-utils";
import type { KeywordHit, NormalizedFilters, NormalizedQuery } from "./search-types";

/**
 * 关键词检索适配器接口
 */
export interface KeywordSearchAdapter {
  search(params: {
    space: string;
    query: NormalizedQuery;
    filters: NormalizedFilters;
    topK: number;
  }): Promise<KeywordHit[]>;
}

/**
 * Mock 关键词检索适配器
 */
export class MockKeywordSearchAdapter implements KeywordSearchAdapter {
  /**
   * 执行关键词检索
   *
   * 功能说明：
   * * 生成固定格式的 mock 结果，便于链路调试
   *
   * @param params 搜索参数
   * @returns 关键词命中结果列表
   */
  async search(params: {
    space: string;
    query: NormalizedQuery;
    filters: NormalizedFilters;
    topK: number;
  }): Promise<KeywordHit[]> {
    const { query, space, topK } = params;
    const count = Math.max(1, Math.min(3, topK));
    const hits: KeywordHit[] = [];
    for (let index = 0; index < count; index += 1) {
      hits.push({
        id: `kw_${query.normalized}_${index + 1}`,
        score: clampScore(0.8 - index * 0.15),
        text: `keyword hit ${index + 1} for "${query.normalized}"`,
        metadata: {
          space,
          adapter: "mock-keyword",
        },
      });
    }
    return hits;
  }
}

// TODO: replace mock adapter with real SQL/FTS adapter in storage integration phase

