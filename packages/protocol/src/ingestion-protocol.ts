/**
 * Ingestion 协议定义
 *
 * 所属模块：
 * * protocol
 *
 * 文件作用：
 * * 定义知识摄入上传与阶段执行的请求响应协议
 *
 * 主要功能：
 * * IngestionUploadRequest / Response
 * * IngestionStageRequest / Response
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 仅保留通用字段，不带行业化属性
 */

/**
 * 上传请求
 */
export interface IngestionUploadRequest {
  sourceId?: string;
  rawText?: string;
  fileUri?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 上传响应
 */
export interface IngestionUploadResponse {
  sourceId: string;
  taskId: string;
  status: "uploaded" | "failed";
  message?: string;
}

/**
 * 阶段请求
 */
export interface IngestionStageRequest {
  sourceId: string;
  taskId: string;
  params?: Record<string, unknown>;
}

/**
 * 阶段响应
 */
export interface IngestionStageResponse {
  sourceId: string;
  taskId: string;
  status: string;
  message?: string;
}

