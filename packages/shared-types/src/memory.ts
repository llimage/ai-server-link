/**
 * Memory 共享类型
 *
 * 所属模块：
 * * shared-types
 *
 * 文件作用：
 * * 定义 memory/memory summary 的通用结构
 */

export interface MemoryEntity {
  id: string;
  userId: string;
  content: string;
  tags?: string[];
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemorySummaryEntity {
  id: string;
  userId: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

