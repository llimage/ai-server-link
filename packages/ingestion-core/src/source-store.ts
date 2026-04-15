/**
 * Ingestion Core 知识源存储
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 定义知识源记录存储接口与内存实现
 *
 * 主要功能：
 * * KnowledgeSourceStore
 * * InMemoryKnowledgeSourceStore
 *
 * 依赖：
 * * ingestion-types
 *
 * 注意事项：
 * * 当前为内存实现，仅用于本批最小闭环
 */

import type { KnowledgeSourceRecord } from "./ingestion-types";

/**
 * 知识源存储接口
 */
export interface KnowledgeSourceStore {
  get(sourceId: string): Promise<KnowledgeSourceRecord | null>;
  set(record: KnowledgeSourceRecord): Promise<void>;
  list(): Promise<KnowledgeSourceRecord[]>;
  delete(sourceId: string): Promise<void>;
}

/**
 * 内存知识源存储
 */
export class InMemoryKnowledgeSourceStore implements KnowledgeSourceStore {
  // TODO: replace in-memory source store with persistent storage in storage phase
  private readonly store = new Map<string, KnowledgeSourceRecord>();

  /**
   * 获取知识源
   */
  async get(sourceId: string): Promise<KnowledgeSourceRecord | null> {
    return this.store.get(sourceId) ?? null;
  }

  /**
   * 保存知识源
   */
  async set(record: KnowledgeSourceRecord): Promise<void> {
    this.store.set(record.sourceId, record);
  }

  /**
   * 列出全部知识源
   */
  async list(): Promise<KnowledgeSourceRecord[]> {
    return [...this.store.values()];
  }

  /**
   * 删除知识源
   */
  async delete(sourceId: string): Promise<void> {
    this.store.delete(sourceId);
  }
}

