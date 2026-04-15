/**
 * Records Core 内存存储实现
 *
 * 所属模块：
 * * records-core
 *
 * 文件作用：
 * * 提供 records store 的内存版实现
 * * 支持 write/query/get/update 的最小闭环
 *
 * 主要功能：
 * * InMemoryRecordsStore
 * * 按 user/space/type/tags 过滤查询
 * * 默认按 updatedAt 倒序输出
 *
 * 依赖：
 * * records-types
 * * protocol records 协议类型
 *
 * 注意事项：
 * * 当前为运行时骨架阶段，数据不持久化
 */

import type { RecordItem, RecordsQueryRequest } from "protocol";
import type { RecordsStore } from "./records-types";

// TODO: replace in-memory records store with persistent storage in storage phase

/**
 * 内存版记录存储
 *
 * 功能说明：
 * * 使用 Map 保存记录数据
 * * 提供最小查询过滤能力
 */
export class InMemoryRecordsStore implements RecordsStore {
  private readonly records = new Map<string, RecordItem>();

  /**
   * 写入记录
   *
   * @param item 记录条目
   * @returns 无返回值
   */
  async write(item: RecordItem): Promise<void> {
    this.records.set(item.recordId, item);
  }

  /**
   * 查询记录
   *
   * @param params 查询参数
   * @returns 匹配记录列表（按 updatedAt 倒序）
   */
  async query(params: RecordsQueryRequest): Promise<RecordItem[]> {
    const limit = params.limit && params.limit > 0 ? params.limit : 50;
    const rows = Array.from(this.records.values()).filter((item) => {
      if (item.userId !== params.userId) {
        return false;
      }
      if (params.space && item.space !== params.space) {
        return false;
      }
      if (params.type && item.type !== params.type) {
        return false;
      }
      if (params.tags?.length) {
        const itemTags = item.tags ?? [];
        const hasAllTags = params.tags.every((tag) => itemTags.includes(tag));
        if (!hasAllTags) {
          return false;
        }
      }
      return true;
    });
    rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return rows.slice(0, limit);
  }

  /**
   * 按 ID 获取记录
   *
   * @param recordId 记录 ID
   * @returns 记录或 null
   */
  async get(recordId: string): Promise<RecordItem | null> {
    return this.records.get(recordId) ?? null;
  }

  /**
   * 按 ID 更新记录
   *
   * @param recordId 记录 ID
   * @param patch 更新字段
   * @returns 更新后的记录或 null
   */
  async update(
    recordId: string,
    patch: Partial<RecordItem>,
  ): Promise<RecordItem | null> {
    const existing = this.records.get(recordId);
    if (!existing) {
      return null;
    }
    const updated: RecordItem = {
      ...existing,
      ...patch,
      recordId: existing.recordId,
      userId: existing.userId,
    };
    this.records.set(recordId, updated);
    return updated;
  }
}

