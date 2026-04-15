/**
 * Ingestion Core 索引器
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 定义索引写入接口与 mock 实现
 *
 * 主要功能：
 * * Indexer 接口
 * * MockIndexer 实现
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 当前不接真实向量库，仅写入内存索引结构
 */

/**
 * 索引写入参数
 */
export interface IndexParams {
  sourceId: string;
  chunks: string[];
  embeddings: number[][];
  metadata?: Record<string, unknown>;
}

/**
 * 索引器接口
 */
export interface Indexer {
  index(params: IndexParams): Promise<void>;
}

/**
 * 内存索引记录
 */
export interface IndexedRecord extends IndexParams {
  indexedAt: string;
}

/**
 * Mock 索引器
 */
export class MockIndexer implements Indexer {
  private readonly records = new Map<string, IndexedRecord>();

  /**
   * 写入索引
   *
   * @param params 索引参数
   * @returns void
   */
  async index(params: IndexParams): Promise<void> {
    this.records.set(params.sourceId, {
      ...params,
      indexedAt: new Date().toISOString(),
    });
    // TODO: replace mock indexer with real vector index integration
  }

  /**
   * 查询索引记录（测试辅助）
   *
   * @param sourceId 知识源 ID
   * @returns 索引记录或 null
   */
  async get(sourceId: string): Promise<IndexedRecord | null> {
    return this.records.get(sourceId) ?? null;
  }
}

