/**
 * Plans 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 plans/plan_runs 表读写能力
 */

import type { Plan, PlanRun, Prisma } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class PlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPlan(data: Prisma.PlanCreateInput): Promise<Plan> {
    return this.prisma.plan.create({ data });
  }

  async queryPlans(params: {
    userId: string;
    space?: string;
    type?: string;
    status?: string;
    limit?: number;
  }): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      where: {
        userId: params.userId,
        space: params.space,
        type: params.type,
        status: params.status,
      },
      orderBy: { updatedAt: "desc" },
      take: params.limit ?? 20,
    });
  }

  async updatePlanStatus(planId: string, status: string): Promise<Plan> {
    const now = new Date();
    return this.prisma.plan.update({
      where: { id: planId },
      data: {
        status,
        activatedAt: status === "active" ? now : undefined,
        pausedAt: status === "paused" ? now : undefined,
      },
    });
  }

  async createPlanRun(data: Prisma.PlanRunCreateInput): Promise<PlanRun> {
    return this.prisma.planRun.create({ data });
  }

  async listPlanRuns(planId: string): Promise<PlanRun[]> {
    return this.prisma.planRun.findMany({
      where: { planId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPlanById(planId: string): Promise<Plan | null> {
    return this.prisma.plan.findUnique({ where: { id: planId } });
  }
}
