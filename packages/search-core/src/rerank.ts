/**
 * Search Core Rerank 适配器
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 定义 rerank 接口并提供当前批次 mock 实现
 *
 * 主要功能：
 * * RerankAdapter 接口
 * * MockRerankAdapter 实现
 *
 * 依赖：
 * * search-types
 *
 * 注意事项：
 * * 本批次不接真实 rerank 模型
 */

import type { MergedHit, NormalizedQuery } from "./search-types";

/**
 * Rerank 适配器接口
 */
export interface RerankAdapter {
  rerank(params: {
    query: NormalizedQuery;
    hits: MergedHit[];
    topN: number;
  }): Promise<MergedHit[]>;
}

/**
 * Mock Rerank 适配器
 */
export class MockRerankAdapter implements RerankAdapter {
  /**
   * 执行 rerank
   *
   * 功能说明：
   * * 对前 topN 按 score 保持降序并返回，作为占位行为
   *
   * @param params rerank 参数
   * @returns rerank 后结果
   */
  async rerank(params: {
    query: NormalizedQuery;
    hits: MergedHit[];
    topN: number;
  }): Promise<MergedHit[]> {
    void params.query;
    const head = [...params.hits]
      .slice(0, params.topN)
      .sort((left, right) => right.score - left.score);
    const tail = params.hits.slice(params.topN);
    return [...head, ...tail];
  }
}

// TODO: replace mock rerank with model-based rerank in ranking phase

