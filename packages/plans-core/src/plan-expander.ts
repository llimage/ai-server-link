/**
 * Plans Core 计划展开器
 *
 * 所属模块：
 * * plans-core
 *
 * 文件作用：
 * * 提供 plans.expand 的最小可用展开逻辑
 * * 为后续规则引擎替换预留稳定接口
 *
 * 主要功能：
 * * expandPlanItems
 *
 * 依赖：
 * * protocol plans 协议类型
 *
 * 注意事项：
 * * 当前仅为 naive 展开，不实现复杂时间规则
 */

import type { PlanItem, PlansExpandResponse } from "protocol";

// TODO: replace naive plan expander with rule-based schedule expansion

/**
 * 展开计划条目
 *
 * 功能说明：
 * * 若 payload 提供 scheduleItems 数组则直接映射
 * * 否则返回单条默认展开结果
 *
 * @param plan 计划条目
 * @param date 可选日期，未传则使用当天
 * @returns 展开响应
 */
export function expandPlanItems(
  plan: PlanItem,
  date?: string,
): PlansExpandResponse {
  const baseDate = date ?? new Date().toISOString().slice(0, 10);
  const candidate = plan.payload["scheduleItems"];
  if (Array.isArray(candidate) && candidate.length > 0) {
    const items = candidate
      .map((value) => {
        if (typeof value !== "object" || value === null) {
          return null;
        }
        const rawTime = (value as { time?: unknown }).time;
        const time = typeof rawTime === "string" && rawTime ? rawTime : "09:00";
        return {
          scheduledAt: `${baseDate}T${time}:00.000Z`,
          payload: { ...plan.payload },
        };
      })
      .filter((item): item is { scheduledAt: string; payload: Record<string, unknown> } =>
        item !== null,
      );
    if (items.length > 0) {
      return {
        planId: plan.planId,
        items,
      };
    }
  }

  return {
    planId: plan.planId,
    items: [
      {
        scheduledAt: `${baseDate}T09:00:00.000Z`,
        payload: { ...plan.payload },
      },
    ],
  };
}

