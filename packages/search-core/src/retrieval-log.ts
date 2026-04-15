/**
 * Search Core 检索日志
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 定义检索日志记录结构与日志写入接口
 * * 提供 in-memory sink 用于本批次审计与调试
 *
 * 主要功能：
 * * RetrievalLogRecord
 * * RetrievalLogSink
 * * InMemoryRetrievalLogSink
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 当前日志不持久化，重启后会清空
 */

/**
 * 检索日志记录
 */
export interface RetrievalLogRecord {
  ts: string;
  space: string;
  query: string;
  normalizedQuery: string;
  filters: Record<string, unknown>;
  mode: string;
  topK: number;
  keywordHits: number;
  vectorHits: number;
  mergedHits: number;
  rerankApplied: boolean;
  resultCount: number;
  durationMs: number;
}

/**
 * 检索日志写入接口
 */
export interface RetrievalLogSink {
  write(record: RetrievalLogRecord): Promise<void>;
  list?(): Promise<RetrievalLogRecord[]>;
}

/**
 * 内存检索日志 Sink
 */
export class InMemoryRetrievalLogSink implements RetrievalLogSink {
  private readonly records: RetrievalLogRecord[] = [];

  /**
   * 写入检索日志
   *
   * @param record 日志记录
   * @returns void
   */
  async write(record: RetrievalLogRecord): Promise<void> {
    this.records.push(record);
  }

  /**
   * 列出全部日志
   *
   * @returns 日志记录列表
   */
  async list(): Promise<RetrievalLogRecord[]> {
    return [...this.records];
  }
}
