/**
 * Ingestion Core 任务存储
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 定义摄入任务存储接口与内存实现
 *
 * 主要功能：
 * * IngestionTaskStore
 * * InMemoryIngestionTaskStore
 *
 * 依赖：
 * * ingestion-types
 *
 * 注意事项：
 * * 当前为内存实现，重启会丢失
 */

import type { IngestionTask } from "./ingestion-types";

/**
 * 摄入任务存储接口
 */
export interface IngestionTaskStore {
  get(taskId: string): Promise<IngestionTask | null>;
  set(task: IngestionTask): Promise<void>;
  list(): Promise<IngestionTask[]>;
  delete(taskId: string): Promise<void>;
}

/**
 * 内存任务存储
 */
export class InMemoryIngestionTaskStore implements IngestionTaskStore {
  private readonly store = new Map<string, IngestionTask>();

  /**
   * 获取任务
   */
  async get(taskId: string): Promise<IngestionTask | null> {
    return this.store.get(taskId) ?? null;
  }

  /**
   * 保存任务
   */
  async set(task: IngestionTask): Promise<void> {
    this.store.set(task.taskId, task);
  }

  /**
   * 列出全部任务
   */
  async list(): Promise<IngestionTask[]> {
    return [...this.store.values()];
  }

  /**
   * 删除任务
   */
  async delete(taskId: string): Promise<void> {
    this.store.delete(taskId);
  }
}

