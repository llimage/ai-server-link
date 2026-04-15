/**
 * 审计日志服务
 *
 * 所属模块：
 * * main-server/modules/audit
 *
 * 文件作用：
 * * 提供审计日志写入与查询能力
 */

import { AuditLogRepository } from "../../../repositories/audit-log.repository";
import type { Prisma } from "@prisma/client";

export class AuditLogService {
  constructor(private readonly repository: AuditLogRepository) {}

  async appendAuditLog(payload: {
    actorType: string;
    actorId?: string;
    action: string;
    targetType?: string;
    targetId?: string;
    detailJson?: Record<string, unknown>;
  }): Promise<void> {
    await this.repository.appendAuditLog({
      actorType: payload.actorType,
      actorId: payload.actorId,
      action: payload.action,
      targetType: payload.targetType,
      targetId: payload.targetId,
      detailJson: payload.detailJson as Prisma.InputJsonValue | undefined,
    });
  }
}
