/**
 * Ingestion Task 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 ingestion_tasks 表读写
 *
 * 主要功能：
 * * get
 * * upsert
 *
 * 依赖：
 * * PrismaService：数据库访问
 *
 * 注意事项：
 * * taskId 由 ingestion-core 生成，直接作为主键使用
 */

import type { IngestionTask, Prisma } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class IngestionTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取任务
   *
   * 功能说明：
   * 根据 taskId 读取任务记录
   *
   * @param taskId 任务 ID
   * @returns 任务记录或 null
   */
  async get(taskId: string): Promise<IngestionTask | null> {
    return this.prisma.ingestionTask.findUnique({ where: { id: taskId } });
  }

  /**
   * 写入或更新任务
   *
   * 功能说明：
   * 使用 upsert 方式写入 ingestion_tasks
   *
   * @param data 任务数据
   * @returns 任务记录
   */
  async upsert(data: Prisma.IngestionTaskCreateInput): Promise<IngestionTask> {
    return this.prisma.ingestionTask.upsert({
      where: { id: data.id },
      create: data,
      update: {
        stage: data.stage,
        errorMessage: data.errorMessage ?? null,
      },
    });
  }
}
