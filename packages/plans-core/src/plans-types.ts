/**
 * Plans Core 类型定义
 *
 * 所属模块：
 * * plans-core
 *
 * 文件作用：
 * * 定义 plans-core 内部类型与存储抽象
 *
 * 主要功能：
 * * PlansStore 接口
 * * PlanItem 与 PlanStatus 类型复用导出
 *
 * 依赖：
 * * protocol plans 协议
 *
 * 注意事项：
 * * 本模块只承载通用计划能力，不包含行业语义
 */

import type { PlanItem, PlansQueryRequest } from "protocol";

/**
 * 计划存储抽象接口
 */
export interface PlansStore {
  /**
   * 写入计划
   *
   * @param item 计划条目
   * @returns 无返回值
   */
  write(item: PlanItem): Promise<void>;

  /**
   * 查询计划
   *
   * @param params 查询参数
   * @returns 计划列表
   */
  query(params: PlansQueryRequest): Promise<PlanItem[]>;

  /**
   * 按 ID 获取计划
   *
   * @param planId 计划 ID
   * @returns 计划或 null
   */
  get(planId: string): Promise<PlanItem | null>;

  /**
   * 按 ID 更新计划
   *
   * @param planId 计划 ID
   * @param patch 更新字段
   * @returns 更新后的计划或 null
   */
  update(planId: string, patch: Partial<PlanItem>): Promise<PlanItem | null>;
}

export type { PlanItem, PlanStatus } from "protocol";

