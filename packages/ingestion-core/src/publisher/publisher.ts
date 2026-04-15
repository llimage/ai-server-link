/**
 * Ingestion Core 发布器
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 定义发布接口并提供 mock 发布实现
 *
 * 主要功能：
 * * Publisher 接口
 * * MockPublisher 实现
 *
 * 依赖：
 * * source-store
 *
 * 注意事项：
 * * 当前实现仅标记 source 为已发布
 */

import type { KnowledgeSourceStore } from "../source-store";

/**
 * 发布接口
 */
export interface Publisher {
  publish(sourceId: string): Promise<void>;
}

/**
 * Mock 发布器
 */
export class MockPublisher implements Publisher {
  /**
   * 构造发布器
   *
   * @param sourceStore 知识源存储
   */
  constructor(private readonly sourceStore: KnowledgeSourceStore) {}

  /**
   * 发布知识源
   *
   * @param sourceId 知识源 ID
   * @returns void
   */
  async publish(sourceId: string): Promise<void> {
    const source = await this.sourceStore.get(sourceId);
    if (!source) {
      throw new Error("Source not found for publish");
    }
    source.published = true;
    source.updatedAt = new Date().toISOString();
    await this.sourceStore.set(source);
  }
}

