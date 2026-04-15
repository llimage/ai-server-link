/**
 * Records 共享类型
 *
 * 所属模块：
 * * shared-types
 *
 * 文件作用：
 * * 定义 records 持久化阶段通用类型
 *
 * 主要功能：
 * * RecordEntity
 * * CreateRecordInput
 * * QueryRecordsInput
 */

export interface RecordEntity {
  id: string;
  userId: string;
  space: string;
  type: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecordInput {
  userId: string;
  space: string;
  type: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface QueryRecordsInput {
  userId: string;
  space?: string;
  type?: string;
  limit?: number;
}

