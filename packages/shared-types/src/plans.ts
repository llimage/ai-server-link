/**
 * Plans 共享类型
 *
 * 所属模块：
 * * shared-types
 *
 * 文件作用：
 * * 定义 plans 持久化阶段通用类型
 */

export type PlanStatus = "draft" | "active" | "paused" | "archived";

export interface PlanEntity {
  id: string;
  userId: string;
  space: string;
  type: string;
  status: PlanStatus;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

