/**
 * Memory Core 记忆存储
 *
 * 所属模块：
 * * memory-core
 *
 * 文件作用：
 * * 提供 memory store 内存实现
 *
 * 主要功能：
 * * write
 * * search
 * * listByUser
 *
 * 依赖：
 * * protocol
 * * memory-types
 * * memory-search
 *
 * 注意事项：
 * * 当前为内存实现，重启后记忆数据会丢失
 */

import type { MemoryItem } from "protocol";
import type { MemoryStore } from "./memory-types";
import { searchMemoryItems } from "./memory-search";

export class InMemoryMemoryStore implements MemoryStore {
  // TODO: replace in-memory memory store with persistent storage in storage phase
  private readonly items: MemoryItem[] = [];

  /**
   * 写入记忆
   *
   * @param item 记忆条目
   * @returns void
   */
  async write(item: MemoryItem): Promise<void> {
    this.items.push(item);
  }

  /**
   * 搜索记忆
   *
   * @param params 搜索参数
   * @returns 命中结果
   */
  async search(params: {
    userId: string;
    query: string;
    topK: number;
    tags?: string[];
  }): Promise<MemoryItem[]> {
    const byUser = this.items.filter((item) => item.userId === params.userId);
    const byTag = (params.tags?.length ?? 0) > 0
      ? byUser.filter((item) =>
          (item.tags ?? []).some((tag) => (params.tags ?? []).includes(tag)),
        )
      : byUser;
    return searchMemoryItems(byTag, params.query, params.topK);
  }

  /**
   * 列出用户记忆
   *
   * @param userId 用户 ID
   * @returns 用户记忆列表
   */
  async listByUser(userId: string): Promise<MemoryItem[]> {
    return this.items
      .filter((item) => item.userId === userId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }
}

