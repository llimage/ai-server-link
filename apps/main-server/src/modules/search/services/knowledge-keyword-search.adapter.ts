/**
 * Search 数据库关键字检索适配器
 *
 * 所属模块：
 * * main-server/modules/search
 *
 * 文件作用：
 * * 基于 knowledge_chunks / knowledge_documents / knowledge_sources 执行 keyword 检索
 * * 仅返回已 published 的知识内容
 *
 * 主要功能：
 * * search
 *
 * 依赖：
 * * KnowledgeRepository
 * * search-core KeywordSearchAdapter
 *
 * 注意事项：
 * * 本阶段仍为 keyword 检索，不接向量库
 */

import type { KeywordSearchAdapter } from "search-core";
import { clampScore } from "search-core";
import type { NormalizedFilters, NormalizedQuery, KeywordHit } from "search-core";
import { KnowledgeRepository } from "../../../repositories/knowledge.repository";

export class KnowledgeKeywordSearchAdapter implements KeywordSearchAdapter {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  /**
   * 执行关键字检索
   *
   * 功能说明：
   * 从知识 chunk 中按关键字检索并返回 hit
   *
   * @param params 检索参数
   * @returns 检索命中列表
   */
  async search(params: {
    space: string;
    query: NormalizedQuery;
    filters: NormalizedFilters;
    topK: number;
  }): Promise<KeywordHit[]> {
    const tenantId = resolveTenantId(params.filters.values);
    const results = await this.knowledgeRepository.searchPublishedChunks({
      query: params.query.normalized,
      tenantId,
      topK: params.topK,
    });
    return results.map((result, index) => ({
      id: result.chunk.id,
      score: clampScore(0.9 - index * 0.05),
      text: result.chunk.chunkText,
      metadata: {
        space: params.space,
        tenantId: result.source.tenantId,
        sourceId: result.source.id,
        documentId: result.document.id,
        chunkId: result.chunk.id,
      },
    }));
  }
}

/**
 * 解析 tenantId
 *
 * 功能说明：
 * 从 filters 中读取 tenant_id 或 tenantId
 *
 * @param filters 过滤条件
 * @returns tenantId
 */
function resolveTenantId(filters: Record<string, unknown>): string | undefined {
  if (typeof filters.tenant_id === "string" && filters.tenant_id) {
    return filters.tenant_id;
  }
  if (typeof filters.tenantId === "string" && filters.tenantId) {
    return filters.tenantId;
  }
  return undefined;
}
