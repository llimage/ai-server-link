/**
 * Search Core 向量检索适配器
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 定义向量检索接口与当前批次 mock 实现
 *
 * 主要功能：
 * * VectorSearchAdapter 接口
 * * MockVectorSearchAdapter 实现
 *
 * 依赖：
 * * search-types
 * * search-profile
 * * score-utils
 *
 * 注意事项：
 * * 当前实现不做真实 embedding 和向量库查询
 */

import { clampScore } from "./score-utils";
import type { SearchProfile } from "./search-profile";
import type { NormalizedFilters, NormalizedQuery, VectorHit } from "./search-types";

/**
 * 向量检索适配器接口
 */
export interface VectorSearchAdapter {
  search(params: {
    space: string;
    query: NormalizedQuery;
    filters: NormalizedFilters;
    topK: number;
    profile: SearchProfile;
  }): Promise<VectorHit[]>;
}

/**
 * Mock 向量检索适配器
 */
export class MockVectorSearchAdapter implements VectorSearchAdapter {
  /**
   * 执行向量检索
   *
   * 功能说明：
   * * 生成固定格式的 mock 结果，模拟向量召回
   *
   * @param params 搜索参数
   * @returns 向量命中结果列表
   */
  async search(params: {
    space: string;
    query: NormalizedQuery;
    filters: NormalizedFilters;
    topK: number;
    profile: SearchProfile;
  }): Promise<VectorHit[]> {
    const { query, space, topK, profile } = params;
    const count = Math.max(1, Math.min(3, topK));
    const hits: VectorHit[] = [];
    for (let index = 0; index < count; index += 1) {
      hits.push({
        id: `vec_${query.normalized}_${index + 1}`,
        score: clampScore(0.75 - index * 0.12),
        text: `vector hit ${index + 1} for "${query.normalized}"`,
        metadata: {
          space,
          adapter: "mock-vector",
          dimension: profile.embedding.dimension,
        },
      });
    }
    return hits;
  }
}

// TODO: replace mock adapter with real pgvector/LanceDB adapter in vector phase

