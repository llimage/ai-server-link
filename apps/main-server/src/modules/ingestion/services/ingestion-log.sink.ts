/**
 * Ingestion 数据库存储 - IngestionLogSink
 *
 * 所属模块：
 * * main-server/modules/ingestion
 *
 * 文件作用：
 * * 将 ingestion 日志写入 ingestion_logs
 *
 * 主要功能：
 * * write
 *
 * 依赖：
 * * IngestionLogRepository
 *
 * 注意事项：
 * * 日志只追加，不做删除
 */

import type { IngestionLogSink, IngestionLogRecord } from "ingestion-core";
import { IngestionLogRepository } from "../../../repositories/ingestion-log.repository";

export class DatabaseIngestionLogSink implements IngestionLogSink {
  constructor(private readonly logRepository: IngestionLogRepository) {}

  /**
   * 写入 ingestion 日志
   *
   * 功能说明：
   * 将 ingestion-core 生成的日志持久化到数据库
   *
   * @param record 日志记录
   * @returns void
   */
  async write(record: IngestionLogRecord): Promise<void> {
    await this.logRepository.create({
      taskId: record.taskId,
      sourceId: record.sourceId,
      stage: record.stage,
      message: record.message,
    });
  }
}
