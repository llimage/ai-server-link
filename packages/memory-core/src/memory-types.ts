/**
 * Memory Core 记忆类型
 *
 * 所属模块：
 * * memory-core
 *
 * 文件作用：
 * * 定义 memory 记录与存储接口
 *
 * 主要功能：
 * * MemoryRecord
 * * MemoryStore
 *
 * 依赖：
 * * protocol
 *
 * 注意事项：
 * * 记忆记录采用文本优先的通用结构
 */

import type { MemoryItem } from "protocol";

export type MemoryRecord = MemoryItem;

export interface MemoryStore {
  write(item: MemoryItem): Promise<void>;
  search(params: {
    userId: string;
    query: string;
    topK: number;
    tags?: string[];
  }): Promise<MemoryItem[]>;
  listByUser(userId: string): Promise<MemoryItem[]>;
}

