/**
 * Plans 协议定义
 *
 * 所属模块：
 * * protocol
 *
 * 文件作用：
 * * 定义 plans.write / plans.query / plans.activate / plans.pause / plans.expand 协议
 * * 提供通用计划结构与状态类型
 *
 * 主要功能：
 * * 计划写入与查询协议
 * * 计划状态切换协议
 * * 计划展开协议
 *
 * 依赖：
 * * TypeScript 类型系统
 *
 * 注意事项：
 * * 本协议只描述通用计划能力，不包含行业化字段
 */

/**
 * 计划状态
 */
export type PlanStatus = "draft" | "active" | "paused" | "archived";

/**
 * 计划写入请求
 */
export interface PlansWriteRequest {
  userId: string;
  space: string;
  type: string;
  payload: Record<string, unknown>;
  validFrom?: string;
  validTo?: string;
}

/**
 * 计划写入响应
 */
export interface PlansWriteResponse {
  ok: true;
  planId: string;
}

/**
 * 计划条目
 */
export interface PlanItem {
  planId: string;
  userId: string;
  space: string;
  type: string;
  payload: Record<string, unknown>;
  status: PlanStatus;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 计划查询请求
 */
export interface PlansQueryRequest {
  userId: string;
  space?: string;
  type?: string;
  status?: PlanStatus;
  limit?: number;
}

/**
 * 计划查询响应
 */
export interface PlansQueryResponse {
  items: PlanItem[];
}

/**
 * 激活计划请求
 */
export interface PlansActivateRequest {
  planId: string;
}

/**
 * 暂停计划请求
 */
export interface PlansPauseRequest {
  planId: string;
}

/**
 * 计划展开请求
 */
export interface PlansExpandRequest {
  planId: string;
  date?: string;
}

/**
 * 计划展开响应
 */
export interface PlansExpandResponse {
  planId: string;
  items: Array<{
    scheduledAt: string;
    payload: Record<string, unknown>;
  }>;
}

