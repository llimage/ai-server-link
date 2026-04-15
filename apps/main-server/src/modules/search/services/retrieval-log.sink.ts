/**
 * Search 检索日志持久化实现
 *
 * 所属模块：
 * * main-server/modules/search
 *
 * 文件作用：
 * * 将 search.query 的检索日志写入数据库
 *
 * 主要功能：
 * * write
 *
 * 依赖：
 * * RetrievalLogRepository
 * * search-core RetrievalLogSink
 *
 * 注意事项：
 * * 只做落库，不做业务统计
 */

import type { RetrievalLogRecord, RetrievalLogSink } from "search-core";
import { RetrievalLogRepository } from "../../../repositories/retrieval-log.repository";

export class DatabaseRetrievalLogSink implements RetrievalLogSink {
  constructor(private readonly repository: RetrievalLogRepository) {}

  /**
   * 写入检索日志
   *
   * 功能说明：
   * 将 search-core 的日志记录持久化到 retrieval_logs
   *
   * @param record 日志记录
   * @returns void
   */
  async write(record: RetrievalLogRecord): Promise<void> {
    await this.repository.createLog({
      space: record.space,
      query: record.query,
      normalizedQuery: record.normalizedQuery,
      filtersJson: record.filters,
      mode: record.mode,
      topK: record.topK,
      keywordHitCount: record.keywordHits ?? 0,
      vectorHitCount: record.vectorHits ?? 0,
      mergedHitCount: record.mergedHits ?? 0,
      resultCount: record.resultCount ?? 0,
      durationMs: record.durationMs ?? 0,
    });
  }
}
