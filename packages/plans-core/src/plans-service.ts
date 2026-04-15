/**
 * Plans Core 服务编排
 *
 * 所属模块：
 * * plans-core
 *
 * 文件作用：
 * * 编排 plans.write/query/activate/pause/expand 的业务规则
 * * 负责请求校验、ID 生成、状态切换、展开调用
 *
 * 主要功能：
 * * write
 * * query
 * * activate
 * * pause
 * * expand
 *
 * 依赖：
 * * plans-types
 * * plan-expander
 * * protocol plans 协议
 *
 * 注意事项：
 * * 保持通用计划语义，不引入行业字段判断
 */

import { randomUUID } from "node:crypto";
import type {
  PlanItem,
  PlansActivateRequest,
  PlansExpandRequest,
  PlansExpandResponse,
  PlansPauseRequest,
  PlansQueryRequest,
  PlansQueryResponse,
  PlansWriteRequest,
  PlansWriteResponse,
} from "protocol";
import { expandPlanItems } from "./plan-expander";
import type { PlansStore } from "./plans-types";

/**
 * Plans 服务
 */
export class PlansService {
  /**
   * 构造 plans 服务
   *
   * @param store 计划存储
   */
  constructor(private readonly store: PlansStore) {}

  /**
   * 写入计划
   *
   * 功能说明：
   * * 校验 space/type/payload
   * * 创建 planId，默认状态为 draft
   * * 持久到 store
   *
   * @param req 写入请求
   * @returns 写入响应
   *
   * @throws Error 当 space/type 为空或 payload 为空对象时抛出
   */
  async write(req: PlansWriteRequest): Promise<PlansWriteResponse> {
    const space = req.space.trim();
    const type = req.type.trim();
    if (!space) {
      throw new Error("Plan space cannot be empty");
    }
    if (!type) {
      throw new Error("Plan type cannot be empty");
    }
    if (!req.payload || Object.keys(req.payload).length === 0) {
      throw new Error("Plan payload cannot be empty");
    }

    const now = new Date().toISOString();
    const item: PlanItem = {
      planId: `plan_${randomUUID()}`,
      userId: req.userId,
      space,
      type,
      payload: req.payload,
      status: "draft",
      validFrom: req.validFrom,
      validTo: req.validTo,
      createdAt: now,
      updatedAt: now,
    };
    await this.store.write(item);
    return {
      ok: true,
      planId: item.planId,
    };
  }

  /**
   * 查询计划
   *
   * @param req 查询请求
   * @returns 查询响应
   */
  async query(req: PlansQueryRequest): Promise<PlansQueryResponse> {
    const items = await this.store.query(req);
    return { items };
  }

  /**
   * 激活计划
   *
   * 功能说明：
   * * 将计划状态切换为 active
   *
   * @param req 激活请求
   * @returns 通用成功响应
   *
   * @throws Error 当计划不存在时抛出
   */
  async activate(req: PlansActivateRequest): Promise<{ ok: true; planId: string }> {
    const existing = await this.store.get(req.planId);
    if (!existing) {
      throw new Error("Plan not found");
    }
    const now = new Date().toISOString();
    const updated = await this.store.update(req.planId, {
      status: "active",
      updatedAt: now,
    });
    if (!updated) {
      throw new Error("Plan not found");
    }
    return {
      ok: true,
      planId: req.planId,
    };
  }

  /**
   * 暂停计划
   *
   * 功能说明：
   * * 将计划状态切换为 paused
   *
   * @param req 暂停请求
   * @returns 通用成功响应
   *
   * @throws Error 当计划不存在时抛出
   */
  async pause(req: PlansPauseRequest): Promise<{ ok: true; planId: string }> {
    const existing = await this.store.get(req.planId);
    if (!existing) {
      throw new Error("Plan not found");
    }
    const now = new Date().toISOString();
    const updated = await this.store.update(req.planId, {
      status: "paused",
      updatedAt: now,
    });
    if (!updated) {
      throw new Error("Plan not found");
    }
    return {
      ok: true,
      planId: req.planId,
    };
  }

  /**
   * 展开计划
   *
   * 功能说明：
   * * 读取计划并调用 plan-expander 生成当日展开项
   *
   * @param req 展开请求
   * @returns 展开响应
   *
   * @throws Error 当计划不存在时抛出
   */
  async expand(req: PlansExpandRequest): Promise<PlansExpandResponse> {
    const existing = await this.store.get(req.planId);
    if (!existing) {
      throw new Error("Plan not found");
    }
    return expandPlanItems(existing, req.date);
  }
}

