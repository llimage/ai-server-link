/**
 * Knowledge 共享类型
 *
 * 所属模块：
 * * shared-types
 *
 * 文件作用：
 * * 定义 knowledge source/document/chunk 通用结构
 */

export interface KnowledgeSourceEntity {
  id: string;
  tenantId: string;
  fileUri?: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocumentEntity {
  id: string;
  sourceId: string;
  title?: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeChunkEntity {
  id: string;
  documentId: string;
  chunkIndex: number;
  chunkText: string;
  tokenCount: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

