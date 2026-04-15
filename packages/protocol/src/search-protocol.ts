/**
 * Search Core 协议定义
 *
 * 所属模块：
 * * protocol
 *
 * 文件作用：
 * * 定义 search.query 的请求与响应结构
 * * 为 tool 执行与内部调用提供统一类型边界
 *
 * 主要功能：
 * * 定义 SearchMode
 * * 定义 SearchQueryRequest / SearchQueryResponse
 * * 定义 SearchResultItem / SearchDebugInfo
 *
 * 依赖：
 * * 无运行时依赖
 *
 * 注意事项：
 * * 协议保持通用，不绑定任何行业字段
 */

/**
 * 搜索模式
 */
export type SearchMode = "keyword" | "vector" | "hybrid";

/**
 * 搜索请求参数
 */
export interface SearchQueryRequest {
  space: string;
  query: string;
  filters?: Record<string, unknown>;
  topK?: number;
  mode?: SearchMode;
  profileId?: string;
  debug?: boolean;
}

/**
 * 搜索结果条目
 */
export interface SearchResultItem {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
  source?: {
    sourceId?: string;
    documentId?: string;
    chunkId?: string;
  };
}

/**
 * 搜索调试信息
 */
export interface SearchDebugInfo {
  normalizedQuery?: string;
  keywordHits?: number;
  vectorHits?: number;
  mergedHits?: number;
  rerankApplied?: boolean;
}

/**
 * 搜索响应结果
 */
export interface SearchQueryResponse {
  items: SearchResultItem[];
  debug?: SearchDebugInfo;
}

