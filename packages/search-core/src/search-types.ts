/**
 * Search Core 内部类型定义
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 定义 Search Core 编排过程中使用的中间类型
 *
 * 主要功能：
 * * 定义 query/filter 归一化类型
 * * 定义 keyword/vector/merged hit 类型
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 该文件仅描述内部结构，不直接暴露 HTTP 协议
 */

/**
 * 归一化查询
 */
export interface NormalizedQuery {
  raw: string;
  normalized: string;
  tokens?: string[];
}

/**
 * 归一化过滤条件
 */
export interface NormalizedFilters {
  values: Record<string, unknown>;
}

/**
 * 关键词召回结果
 */
export interface KeywordHit {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
}

/**
 * 向量召回结果
 */
export interface VectorHit {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
}

/**
 * 合并后的候选结果
 */
export interface MergedHit {
  id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
  keywordScore?: number;
  vectorScore?: number;
}

