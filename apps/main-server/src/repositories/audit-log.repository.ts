/**
 * Audit Log 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 audit_logs 表读写能力
 */

import type { AuditLog, Prisma } from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async appendAuditLog(data: Prisma.AuditLogCreateInput): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data });
  }

  async listByActorId(actorId: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { actorId },
      orderBy: { createdAt: "desc" },
    });
  }
}

