/**
 * Plans 持久化服务
 *
 * 所属模块：
 * * main-server/modules/plans
 *
 * 文件作用：
 * * 基于 PlansRepository 实现 plans.write/query/activate/pause/expand 协议
 * * 提供计划状态编排，杜绝内存存储路径
 *
 * 依赖：
 * * PlansRepository
 * * AuditLogService（可选）
 */

import type { PlansRepository } from "../../../repositories/plans.repository";
import type { Prisma } from "@prisma/client";
import type {
  PlansActivateRequest,
  PlansExpandRequest,
  PlansExpandResponse,
  PlansPauseRequest,
  PlansQueryRequest,
  PlansQueryResponse,
  PlansWriteRequest,
  PlansWriteResponse,
} from "protocol";
import type { AuditLogService } from "../../audit/services/audit-log.service";

export class PersistentPlansService {
  constructor(
    private readonly repository: PlansRepository,
    private readonly auditLogService?: AuditLogService,
  ) {}

  async write(req: PlansWriteRequest): Promise<PlansWriteResponse> {
    const row = await this.repository.createPlan({
      userId: req.userId,
      space: req.space,
      type: req.type,
      status: "draft",
      payloadJson: req.payload as Prisma.InputJsonValue,
      metadataJson: {
        validFrom: req.validFrom,
        validTo: req.validTo,
      } as Prisma.InputJsonValue,
    });
    await this.auditLogService?.appendAuditLog({
      actorType: "user",
      actorId: req.userId,
      action: "plans.write",
      targetType: "plan",
      targetId: row.id,
      detailJson: { space: req.space, type: req.type },
    });
    return { ok: true, planId: row.id };
  }

  async query(req: PlansQueryRequest): Promise<PlansQueryResponse> {
    const rows = await this.repository.queryPlans({
      userId: req.userId,
      space: req.space,
      type: req.type,
      status: req.status,
      limit: req.limit,
    });
    return {
      items: rows.map((row) => {
        const metadata = (row.metadataJson ?? {}) as Record<string, unknown>;
        return {
          planId: row.id,
          userId: row.userId,
          space: row.space,
          type: row.type,
          payload: (row.payloadJson ?? {}) as Record<string, unknown>,
          status: row.status as "draft" | "active" | "paused" | "archived",
          validFrom:
            typeof metadata.validFrom === "string" ? metadata.validFrom : undefined,
          validTo: typeof metadata.validTo === "string" ? metadata.validTo : undefined,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      }),
    };
  }

  async activate(req: PlansActivateRequest): Promise<{ ok: true; planId: string }> {
    const row = await this.repository.updatePlanStatus(req.planId, "active");
    await this.auditLogService?.appendAuditLog({
      actorType: "system",
      action: "plans.activate",
      targetType: "plan",
      targetId: row.id,
    });
    return { ok: true, planId: row.id };
  }

  async pause(req: PlansPauseRequest): Promise<{ ok: true; planId: string }> {
    const row = await this.repository.updatePlanStatus(req.planId, "paused");
    await this.auditLogService?.appendAuditLog({
      actorType: "system",
      action: "plans.pause",
      targetType: "plan",
      targetId: row.id,
    });
    return { ok: true, planId: row.id };
  }

  async expand(req: PlansExpandRequest): Promise<PlansExpandResponse> {
    const plan = await this.repository.getPlanById(req.planId);
    if (!plan) {
      throw new Error("plan not found");
    }
    const baseTime = `${req.date ?? new Date().toISOString().slice(0, 10)}T09:00:00.000Z`;
    return {
      planId: req.planId,
      items: [
        {
          scheduledAt: baseTime,
          payload: (plan.payloadJson ?? {}) as Record<string, unknown>,
        },
      ],
    };
  }
}
