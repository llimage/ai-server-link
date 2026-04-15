/**
 * Search Core 主编排服务
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 编排 query/filter 归一化、召回、合并、rerank 与日志写入
 *
 * 主要功能：
 * * query
 *
 * 依赖：
 * * protocol 搜索协议
 * * search-profile
 * * normalizer / adapter / merge / rerank / log
 *
 * 注意事项：
 * * 该服务只做搜索能力编排，不承载 HTTP 与行业业务逻辑
 */

import type {
  SearchMode,
  SearchQueryRequest,
  SearchQueryResponse,
  SearchResultItem,
} from "protocol";
import { normalizeFilters } from "./filter-normalizer";
import { mergeHybridHits } from "./hybrid-merge";
import type { KeywordSearchAdapter } from "./keyword-search";
import { normalizeQuery } from "./query-normalizer";
import type { RetrievalLogSink } from "./retrieval-log";
import type { RerankAdapter } from "./rerank";
import {
  getDefaultSearchProfile,
  type SearchProfile,
} from "./search-profile";
import type { MergedHit } from "./search-types";
import type { VectorSearchAdapter } from "./vector-search";

/**
 * SearchService 构造依赖
 */
export interface SearchServiceDeps {
  keywordAdapter: KeywordSearchAdapter;
  vectorAdapter: VectorSearchAdapter;
  rerankAdapter: RerankAdapter;
  retrievalLogSink: RetrievalLogSink;
  searchProfileProvider?: (profileId?: string) => SearchProfile;
}

/**
 * 搜索服务
 *
 * 功能说明：
 * * 提供统一 query 能力，支持 keyword/vector/hybrid 模式
 */
export class SearchService {
  /**
   * 构造搜索服务
   *
   * @param deps 依赖集合
   */
  constructor(private readonly deps: SearchServiceDeps) {}

  /**
   * 执行搜索
   *
   * 功能说明：
   * * 按请求模式执行召回、合并、rerank，并输出标准结构
   *
   * @param request 搜索请求
   * @returns 搜索响应
   */
  async query(request: SearchQueryRequest): Promise<SearchQueryResponse> {
    const startedAt = Date.now();
    const profile = this.resolveProfile(request.profileId);
    const normalizedQuery = normalizeQuery(request.query);
    const normalizedFilters = normalizeFilters(request.filters);
    const mode = this.resolveMode(request.mode, profile);
    const topK = this.resolveTopK(request.topK, profile);

    let keywordHits = [] as Awaited<
      ReturnType<KeywordSearchAdapter["search"]>
    >;
    let vectorHits = [] as Awaited<ReturnType<VectorSearchAdapter["search"]>>;
    let merged = [] as MergedHit[];

    if (mode === "keyword") {
      keywordHits = await this.deps.keywordAdapter.search({
        space: request.space,
        query: normalizedQuery,
        filters: normalizedFilters,
        topK,
      });
      merged = keywordHits.map((item) => ({
        id: item.id,
        score: item.score,
        text: item.text,
        metadata: item.metadata,
        keywordScore: item.score,
        vectorScore: 0,
      }));
    } else if (mode === "vector") {
      vectorHits = await this.deps.vectorAdapter.search({
        space: request.space,
        query: normalizedQuery,
        filters: normalizedFilters,
        topK,
        profile,
      });
      merged = vectorHits.map((item) => ({
        id: item.id,
        score: item.score,
        text: item.text,
        metadata: item.metadata,
        keywordScore: 0,
        vectorScore: item.score,
      }));
    } else {
      keywordHits = await this.deps.keywordAdapter.search({
        space: request.space,
        query: normalizedQuery,
        filters: normalizedFilters,
        topK,
      });
      vectorHits = await this.deps.vectorAdapter.search({
        space: request.space,
        query: normalizedQuery,
        filters: normalizedFilters,
        topK,
        profile,
      });
      merged = mergeHybridHits(keywordHits, vectorHits, {
        keywordWeight: profile.search.keywordWeight,
        vectorWeight: profile.search.vectorWeight,
      });
    }

    let rerankApplied = false;
    if (profile.search.rerankEnabled && merged.length > 0) {
      merged = await this.deps.rerankAdapter.rerank({
        query: normalizedQuery,
        hits: merged,
        topN: profile.search.rerankTopN,
      });
      rerankApplied = true;
    }

    const items = merged.slice(0, topK).map<SearchResultItem>((item) => ({
      id: item.id,
      score: item.score,
      text: item.text,
      metadata: item.metadata,
    }));
    const durationMs = Date.now() - startedAt;

    await this.deps.retrievalLogSink.write({
      ts: new Date().toISOString(),
      space: request.space,
      query: request.query,
      normalizedQuery: normalizedQuery.normalized,
      filters: normalizedFilters.values,
      mode,
      topK,
      keywordHits: keywordHits.length,
      vectorHits: vectorHits.length,
      mergedHits: merged.length,
      rerankApplied,
      resultCount: items.length,
      durationMs,
    });

    return {
      items,
      debug: request.debug
        ? {
            normalizedQuery: normalizedQuery.normalized,
            keywordHits: keywordHits.length,
            vectorHits: vectorHits.length,
            mergedHits: merged.length,
            rerankApplied,
          }
        : undefined,
    };
  }

  /**
   * 解析 profile
   *
   * @param profileId profile ID
   * @returns SearchProfile
   */
  private resolveProfile(profileId?: string): SearchProfile {
    return this.deps.searchProfileProvider?.(profileId) ?? getDefaultSearchProfile();
  }

  /**
   * 解析搜索模式
   *
   * @param mode 请求模式
   * @param profile 搜索配置
   * @returns 最终模式
   */
  private resolveMode(mode: SearchMode | undefined, profile: SearchProfile): SearchMode {
    return mode ?? profile.search.defaultMode;
  }

  /**
   * 解析 topK
   *
   * @param topK 请求 topK
   * @param profile 搜索配置
   * @returns 最终 topK
   */
  private resolveTopK(topK: number | undefined, profile: SearchProfile): number {
    const value = topK ?? profile.search.defaultTopK;
    if (!Number.isFinite(value) || value <= 0) {
      return profile.search.defaultTopK;
    }
    return Math.floor(value);
  }
}
