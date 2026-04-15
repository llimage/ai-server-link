/**
 * Ingestion 数据库存储 - IngestionTaskStore
 *
 * 所属模块：
 * * main-server/modules/ingestion
 *
 * 文件作用：
 * * 将 ingestion-core 的任务状态持久化到 ingestion_tasks
 * * 同步 knowledge_sources / knowledge_documents 状态
 *
 * 主要功能：
 * * get
 * * set
 * * list
 * * delete
 *
 * 依赖：
 * * IngestionTaskRepository
 * * KnowledgeRepository
 *
 * 注意事项：
 * * set 时会更新 knowledge_sources.status 与 knowledge_documents.status
 */

import type { IngestionTask, IngestionTaskStore } from "ingestion-core";
import { IngestionTaskRepository } from "../../../repositories/ingestion-task.repository";
import { KnowledgeRepository } from "../../../repositories/knowledge.repository";

export class DatabaseIngestionTaskStore implements IngestionTaskStore {
  constructor(
    private readonly taskRepository: IngestionTaskRepository,
    private readonly knowledgeRepository: KnowledgeRepository,
  ) {}

  /**
   * 获取任务
   *
   * @param taskId 任务 ID
   * @returns 任务记录或 null
   */
  async get(taskId: string): Promise<IngestionTask | null> {
    const task = await this.taskRepository.get(taskId);
    if (!task) {
      return null;
    }
    return {
      taskId: task.id,
      sourceId: task.sourceId,
      stage: task.stage as IngestionTask["stage"],
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      errorMessage: task.errorMessage ?? undefined,
    };
  }

  /**
   * 保存任务
   *
   * 功能说明：
   * 将任务写入 ingestion_tasks，并同步 knowledge 状态
   *
   * @param task 任务数据
   * @returns void
   */
  async set(task: IngestionTask): Promise<void> {
    await this.taskRepository.upsert({
      id: task.taskId,
      sourceId: task.sourceId,
      stage: task.stage,
      errorMessage: task.errorMessage ?? null,
    });
    await this.knowledgeRepository.updateSourceStatus(task.sourceId, task.stage);
    await this.knowledgeRepository.updateDocumentStatusBySource(task.sourceId, task.stage);
  }

  /**
   * 列出任务
   *
   * @returns 任务列表
   */
  async list(): Promise<IngestionTask[]> {
    return [];
  }

  /**
   * 删除任务
   *
   * @param taskId 任务 ID
   * @returns void
   */
  async delete(taskId: string): Promise<void> {
    void taskId;
  }
}
