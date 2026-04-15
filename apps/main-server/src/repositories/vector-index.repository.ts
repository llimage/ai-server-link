/**
 * Vector Index 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装向量索引写入与检索
 * * 隔离业务层与向量库 SDK
 *
 * 主要功能：
 * * upsert
 * * query
 *
 * 依赖：
 * * vector-store-core
 *
 * 注意事项：
 * * 本仓储仅处理向量存取，不做业务过滤
 */

import type {
  VectorQuery,
  VectorRecord,
  VectorSearchResult,
  VectorStore,
} from "vector-store-core";

export class VectorIndexRepository {
  constructor(private readonly store: VectorStore) {}

  /**
   * 幂等写入向量记录
   *
   * 功能说明：
   * * 调用底层 VectorStore upsert
   *
   * @param records 向量记录
   * @returns void
   */
  async upsert(records: VectorRecord[]): Promise<void> {
    await this.store.upsert(records);
  }

  /**
   * 执行向量检索
   *
   * 功能说明：
   * * 调用底层 VectorStore query
   *
   * @param query 查询参数
   * @returns 检索结果
   */
  async query(query: VectorQuery): Promise<VectorSearchResult[]> {
    return this.store.query(query);
  }
}
