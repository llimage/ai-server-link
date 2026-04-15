/**
 * User Meta 共享类型
 *
 * 所属模块：
 * * shared-types
 *
 * 文件作用：
 * * 定义 user metadata 持久化通用结构
 */

export interface UserMetaEntity {
  id: string;
  userId: string;
  key: string;
  value: unknown;
  confidence?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

