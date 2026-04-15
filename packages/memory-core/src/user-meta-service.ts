/**
 * Memory Core 用户元数据服务
 *
 * 所属模块：
 * * memory-core
 *
 * 文件作用：
 * * 编排 user.meta.write 与 user.meta.query 业务逻辑
 *
 * 主要功能：
 * * write
 * * query
 *
 * 依赖：
 * * protocol user-meta 协议
 * * user-meta-store
 *
 * 注意事项：
 * * key 为空字符串时拒绝写入
 */

import { randomUUID } from "node:crypto";
import type {
  UserMetaItem,
  UserMetaQueryRequest,
  UserMetaQueryResponse,
  UserMetaWriteRequest,
  UserMetaWriteResponse,
} from "protocol";
import type { UserMetaStore } from "./user-meta-types";

export class UserMetaService {
  /**
   * 构造元数据服务
   *
   * @param store 元数据存储
   */
  constructor(private readonly store: UserMetaStore) {}

  /**
   * 写入元数据
   *
   * @param req 写入请求
   * @returns 写入结果
   */
  async write(req: UserMetaWriteRequest): Promise<UserMetaWriteResponse> {
    const now = new Date().toISOString();
    const items: UserMetaItem[] = req.items.map((item) => {
      const key = item.key.trim();
      if (!key) {
        throw new Error("Meta key cannot be empty");
      }
      return {
        id: `meta_${randomUUID()}`,
        userId: req.userId,
        key,
        value: item.value,
        source: item.source,
        confidence: item.confidence,
        tags: item.tags,
        createdAt: now,
        updatedAt: now,
      };
    });
    await this.store.writeMany(items);
    return {
      ok: true,
      written: items.length,
    };
  }

  /**
   * 查询元数据
   *
   * @param req 查询请求
   * @returns 查询结果
   */
  async query(req: UserMetaQueryRequest): Promise<UserMetaQueryResponse> {
    const items = await this.store.query({
      userId: req.userId,
      keys: req.keys,
      tags: req.tags,
    });
    return { items };
  }
}

