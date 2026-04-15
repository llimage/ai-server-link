/**
 * Ingestion Core 类型定义
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 定义任务状态与知识源记录的数据模型
 *
 * 主要功能：
 * * IngestionStage
 * * IngestionTask
 * * KnowledgeSourceRecord
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 本批次仅内存模型，不代表最终持久化结构
 */

/**
 * 摄入阶段
 */
export type IngestionStage =
  | "uploaded"
  | "parsed"
  | "chunked"
  | "embedded"
  | "indexed"
  | "published"
  | "failed";

/**
 * 摄入任务
 */
export interface IngestionTask {
  taskId: string;
  sourceId: string;
  stage: IngestionStage;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

/**
 * 知识源记录
 */
export interface KnowledgeSourceRecord {
  sourceId: string;
  rawText?: string;
  fileUri?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
  parsedText?: string;
  chunks?: string[];
  embeddings?: number[][];
  indexed?: boolean;
  published?: boolean;
  createdAt: string;
  updatedAt: string;
}

