/**
 * Memory Core 用户元数据存储
 *
 * 所属模块：
 * * memory-core
 *
 * 文件作用：
 * * 提供 user metadata store 内存实现
 *
 * 主要功能：
 * * writeMany
 * * query（按 userId/keys/tags）
 *
 * 依赖：
 * * protocol
 * * user-meta-types
 *
 * 注意事项：
 * * 默认按更新时间倒序返回，保证最新值优先
 */

import type { UserMetaItem } from "protocol";
import type { UserMetaStore } from "./user-meta-types";

export interface UserMetaStoreApi {
  writeMany(items: UserMetaItem[]): Promise<void>;
  query(params: {
    userId: string;
    keys?: string[];
    tags?: string[];
  }): Promise<UserMetaItem[]>;
}

export class InMemoryUserMetaStore implements UserMetaStore, UserMetaStoreApi {
  // TODO: replace in-memory metadata store with persistent storage in storage phase
  private readonly items: UserMetaItem[] = [];

  /**
   * 批量写入元数据
   *
   * @param items 元数据条目
   * @returns void
   */
  async writeMany(items: UserMetaItem[]): Promise<void> {
    this.items.push(...items);
  }

  /**
   * 查询元数据
   *
   * @param params 查询参数
   * @returns 匹配条目
   */
  async query(params: {
    userId: string;
    keys?: string[];
    tags?: string[];
  }): Promise<UserMetaItem[]> {
    const keySet = params.keys?.length ? new Set(params.keys) : null;
    const tagSet = params.tags?.length ? new Set(params.tags) : null;
    return this.items
      .filter((item) => item.userId === params.userId)
      .filter((item) => (keySet ? keySet.has(item.key) : true))
      .filter((item) => {
        if (!tagSet) {
          return true;
        }
        const tags = item.tags ?? [];
        return tags.some((tag) => tagSet.has(tag));
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }
}

