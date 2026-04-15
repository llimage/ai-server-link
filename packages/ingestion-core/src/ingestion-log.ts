/**
 * Ingestion Core 日志定义
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 定义摄入过程日志结构、写入接口与内存实现
 *
 * 主要功能：
 * * IngestionLogRecord
 * * IngestionLogSink
 * * InMemoryIngestionLogSink
 *
 * 依赖：
 * * ingestion-types
 *
 * 注意事项：
 * * 当前日志仅保存在内存中
 */

import type { IngestionStage } from "./ingestion-types";

/**
 * 日志记录
 */
export interface IngestionLogRecord {
  ts: string;
  taskId: string;
  sourceId: string;
  stage: IngestionStage;
  message?: string;
}

/**
 * 日志输出接口
 */
export interface IngestionLogSink {
  write(record: IngestionLogRecord): Promise<void>;
  list?(): Promise<IngestionLogRecord[]>;
}

/**
 * 内存日志输出实现
 */
export class InMemoryIngestionLogSink implements IngestionLogSink {
  private readonly records: IngestionLogRecord[] = [];

  /**
   * 写日志
   */
  async write(record: IngestionLogRecord): Promise<void> {
    this.records.push(record);
  }

  /**
   * 列出日志
   */
  async list(): Promise<IngestionLogRecord[]> {
    return [...this.records];
  }
}

