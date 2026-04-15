/**
 * Search Core Hybrid 合并器
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 合并关键词与向量召回结果，输出统一候选集合
 *
 * 主要功能：
 * * mergeHybridHits
 *
 * 依赖：
 * * search-types
 * * score-utils
 *
 * 注意事项：
 * * 本文件只做合并与排序，不做模式决策和 rerank
 */

import { clampScore } from "./score-utils";
import type { KeywordHit, MergedHit, VectorHit } from "./search-types";

/**
 * 混合合并权重
 */
export interface HybridMergeWeights {
  keywordWeight: number;
  vectorWeight: number;
}

/**
 * 合并 keyword/vector 结果
 *
 * 功能说明：
 * * 通过 id 聚合双侧命中
 * * 按权重计算最终分数并降序排序
 *
 * @param keywordHits 关键词命中
 * @param vectorHits 向量命中
 * @param weights 合并权重
 * @returns 合并后的候选结果
 */
export function mergeHybridHits(
  keywordHits: KeywordHit[],
  vectorHits: VectorHit[],
  weights: HybridMergeWeights,
): MergedHit[] {
  const byId = new Map<string, MergedHit>();
  const rrfK = 60;

  keywordHits.forEach((item, index) => {
    const rank = index + 1;
    const contribution = weights.keywordWeight / (rrfK + rank);
    const existing = byId.get(item.id);
    if (existing) {
      existing.keywordScore = (existing.keywordScore ?? 0) + contribution;
      if (!existing.text) {
        existing.text = item.text;
      }
      existing.metadata = { ...existing.metadata, ...item.metadata };
      return;
    }
    byId.set(item.id, {
      id: item.id,
      text: item.text,
      metadata: item.metadata,
      score: 0,
      keywordScore: contribution,
      vectorScore: 0,
    });
  });

  vectorHits.forEach((item, index) => {
    const rank = index + 1;
    const contribution = weights.vectorWeight / (rrfK + rank);
    const existing = byId.get(item.id);
    if (existing) {
      existing.vectorScore = (existing.vectorScore ?? 0) + contribution;
      if (!existing.text) {
        existing.text = item.text;
      }
      existing.metadata = { ...existing.metadata, ...item.metadata };
      return;
    }
    byId.set(item.id, {
      id: item.id,
      text: item.text,
      metadata: item.metadata,
      score: 0,
      keywordScore: 0,
      vectorScore: contribution,
    });
  });

  const merged = [...byId.values()].map((item) => {
    const keywordScore = item.keywordScore ?? 0;
    const vectorScore = item.vectorScore ?? 0;
    const finalScore = keywordScore + vectorScore;
    return {
      ...item,
      score: clampScore(finalScore),
    };
  });

  return merged.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    if ((right.keywordScore ?? 0) !== (left.keywordScore ?? 0)) {
      return (right.keywordScore ?? 0) - (left.keywordScore ?? 0);
    }
    if ((right.vectorScore ?? 0) !== (left.vectorScore ?? 0)) {
      return (right.vectorScore ?? 0) - (left.vectorScore ?? 0);
    }
    return left.id.localeCompare(right.id);
  });
}
