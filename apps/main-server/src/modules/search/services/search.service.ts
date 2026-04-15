import type { SearchParams, SearchResult } from "../types";

export class SearchService {
  constructor(
    private keywordAdapter: any,
    private vectorAdapter: any
  ) {}

  async search(params: SearchParams): Promise<SearchResult[]> {
    // 1. keyword 一定先跑（保证兜底）
    const keywordHits = await this.keywordAdapter.search({
      space: params.space,
      query: params.query,
      filters: params.filters,
      topK: params.topK,
      profile: params.profile,
    });

    // 2. vector（允许失败）
    let vectorHits: any[] = [];
    try {
      vectorHits = await this.vectorAdapter.search({
        space: params.space,
        query: params.query,
        filters: params.filters,
        topK: params.topK,
        profile: params.profile,
      });
    } catch (err: any) {
      console.warn("[search-service] vector fallback triggered:", err?.message || err);
      vectorHits = [];
    }

    // ⭐⭐ 核心修复（最后一刀）
    if (!vectorHits || vectorHits.length === 0) {
      return keywordHits;
    }

    // 3. hybrid merge
    const merged = this.mergeHits();
if (!merged || merged.length === 0) {
  console.warn('[search-service] merged empty, fallback to keyword');
  return keywordHits;
}
return merged;
  }

  mergeHits(keywordHits: any[], vectorHits: any[], topK: number) {
    const map = new Map();

    for (const item of keywordHits) {
      map.set(item.id, { ...item, score: item.score || 1 });
    }

    for (const item of vectorHits) {
      if (map.has(item.id)) {
        map.get(item.id).score += item.score || 1;
      } else {
        map.set(item.id, { ...item, score: item.score || 1 });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

