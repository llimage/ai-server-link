/**
 * Memory Core 记忆服务
 *
 * 所属模块：
 * * memory-core
 *
 * 文件作用：
 * * 编排 memory.write 与 memory.search 逻辑
 *
 * 主要功能：
 * * write
 * * search
 *
 * 依赖：
 * * protocol memory 协议
 * * memory-store
 *
 * 注意事项：
 * * 空 content 写入时拒绝
 */

import { randomUUID } from "node:crypto";
import type {
  MemoryItem,
  MemorySearchRequest,
  MemorySearchResponse,
  MemoryWriteRequest,
  MemoryWriteResponse,
} from "protocol";
import type { MemoryStore } from "./memory-types";

export class MemoryService {
  /**
   * 构造记忆服务
   *
   * @param store 记忆存储
   */
  constructor(private readonly store: MemoryStore) {}

  /**
   * 写入记忆
   *
   * @param req 写入请求
   * @returns 写入结果
   */
  async write(req: MemoryWriteRequest): Promise<MemoryWriteResponse> {
    const content = req.content.trim();
    if (!content) {
      throw new Error("Memory content cannot be empty");
    }
    const now = new Date().toISOString();
    const item: MemoryItem = {
      id: `mem_${randomUUID()}`,
      userId: req.userId,
      content,
      kind: req.kind ?? "note",
      source: req.source,
      tags: req.tags,
      createdAt: now,
      updatedAt: now,
    };
    await this.store.write(item);
    return {
      ok: true,
      memoryId: item.id,
    };
  }

  /**
   * 搜索记忆
   *
   * @param req 搜索请求
   * @returns 搜索结果
   */
  async search(req: MemorySearchRequest): Promise<MemorySearchResponse> {
    const topK = req.topK ?? 5;
    const items = await this.store.search({
      userId: req.userId,
      query: req.query,
      topK,
      tags: req.tags,
    });
    return { items };
  }
}

