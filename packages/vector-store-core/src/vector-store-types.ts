/**
 * Vector Store Core - 基础类型
 *
 * 所属模块：
 * * vector-store-core
 *
 * 文件作用：
 * * 定义向量存储的通用结构与接口
 * * 约束写入与检索行为
 *
 * 主要功能：
 * * VectorRecord / VectorQuery / VectorSearchResult
 * * VectorStore 接口
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 保持通用结构，不引入行业字段
 */

/**
 * 向量记录
 */
export interface VectorRecord {
  chunkId: string;
  documentId: string;
  sourceId: string;
  tenantId: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

/**
 * 向量检索参数
 */
export interface VectorQuery {
  vector: number[];
  topK: number;
  tenantId?: string;
}

/**
 * 向量检索结果
 */
export interface VectorSearchResult {
  chunkId: string;
  documentId: string;
  sourceId: string;
  tenantId: string;
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * 向量存储接口
 */
export interface VectorStore {
  /**
   * 写入/更新向量记录
   *
   * 功能说明：
   * * 支持按 chunkId 幂等写入
   *
   * @param records 向量记录
   * @returns void
   */
  upsert(records: VectorRecord[]): Promise<void>;

  /**
   * 向量检索
   *
   * 功能说明：
   * * 根据向量召回相似 chunk
   *
   * @param query 检索参数
   * @returns 命中结果
   */
  query(query: VectorQuery): Promise<VectorSearchResult[]>;
}
