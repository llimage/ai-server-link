/**
 * Plans Core 内存存储实现
 *
 * 所属模块：
 * * plans-core
 *
 * 文件作用：
 * * 提供 plans store 的内存版实现
 * * 支持 write/query/get/update 的最小闭环
 *
 * 主要功能：
 * * InMemoryPlansStore
 * * 按 user/space/type/status 过滤查询
 * * 默认按 updatedAt 倒序输出
 *
 * 依赖：
 * * plans-types
 * * protocol plans 协议类型
 *
 * 注意事项：
 * * 当前为运行时骨架阶段，数据不持久化
 */

import type { PlanItem, PlansQueryRequest } from "protocol";
import type { PlansStore } from "./plans-types";

// TODO: replace in-memory plans store with persistent storage in storage phase

/**
 * 内存版计划存储
 */
export class InMemoryPlansStore implements PlansStore {
  private readonly plans = new Map<string, PlanItem>();

  /**
   * 写入计划
   *
   * @param item 计划条目
   * @returns 无返回值
   */
  async write(item: PlanItem): Promise<void> {
    this.plans.set(item.planId, item);
  }

  /**
   * 查询计划
   *
   * @param params 查询参数
   * @returns 计划列表（按 updatedAt 倒序）
   */
  async query(params: PlansQueryRequest): Promise<PlanItem[]> {
    const limit = params.limit && params.limit > 0 ? params.limit : 50;
    const rows = Array.from(this.plans.values()).filter((item) => {
      if (item.userId !== params.userId) {
        return false;
      }
      if (params.space && item.space !== params.space) {
        return false;
      }
      if (params.type && item.type !== params.type) {
        return false;
      }
      if (params.status && item.status !== params.status) {
        return false;
      }
      return true;
    });
    rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return rows.slice(0, limit);
  }

  /**
   * 按 ID 获取计划
   *
   * @param planId 计划 ID
   * @returns 计划或 null
   */
  async get(planId: string): Promise<PlanItem | null> {
    return this.plans.get(planId) ?? null;
  }

  /**
   * 按 ID 更新计划
   *
   * @param planId 计划 ID
   * @param patch 更新字段
   * @returns 更新后的计划或 null
   */
  async update(planId: string, patch: Partial<PlanItem>): Promise<PlanItem | null> {
    const existing = this.plans.get(planId);
    if (!existing) {
      return null;
    }
    const updated: PlanItem = {
      ...existing,
      ...patch,
      planId: existing.planId,
      userId: existing.userId,
    };
    this.plans.set(planId, updated);
    return updated;
  }
}

