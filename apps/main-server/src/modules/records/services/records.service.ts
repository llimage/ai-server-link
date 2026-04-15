/**
 * Records 持久化服务
 *
 * 所属模块：
 * * main-server/modules/records
 *
 * 文件作用：
 * * 基于 RecordsRepository 实现 records.write/query/update 协议
 * * 提供 records 领域业务编排，不直接操作 Prisma
 *
 * 主要功能：
 * * write
 * * query
 * * update
 *
 * 依赖：
 * * RecordsRepository
 * * AuditLogService（可选）
 *
 * 注意事项：
 * * 本服务已移除内存存储路径
 */

import type { RecordsRepository } from "../../../repositories/records.repository";
import type { Prisma } from "@prisma/client";
import type {
  RecordsQueryRequest,
  RecordsQueryResponse,
  RecordsUpdateRequest,
  RecordsUpdateResponse,
  RecordsWriteRequest,
  RecordsWriteResponse,
} from "protocol";
import type { AuditLogService } from "../../audit/services/audit-log.service";

export class PersistentRecordsService {
  constructor(
    private readonly repository: RecordsRepository,
    private readonly auditLogService?: AuditLogService,
  ) {}

  async write(req: RecordsWriteRequest): Promise<RecordsWriteResponse> {
    const created = await this.repository.createRecord({
      userId: req.userId,
      space: req.space,
      type: req.type,
      payloadJson: req.payload as Prisma.InputJsonValue,
      metadataJson: {
        tags: req.tags ?? [],
        occurredAt: req.occurredAt ?? new Date().toISOString(),
      } as Prisma.InputJsonValue,
    });
    await this.auditLogService?.appendAuditLog({
      actorType: "user",
      actorId: req.userId,
      action: "records.write",
      targetType: "record",
      targetId: created.id,
      detailJson: {
        space: req.space,
        type: req.type,
      },
    });
    return { ok: true, recordId: created.id };
  }

  async query(req: RecordsQueryRequest): Promise<RecordsQueryResponse> {
    const rows = await this.repository.queryRecords({
      userId: req.userId,
      space: req.space,
      type: req.type,
      limit: req.limit,
    });
    return {
      items: rows.map((row) => ({
        recordId: row.id,
        userId: row.userId,
        space: row.space,
        type: row.type,
        payload: (row.payloadJson ?? {}) as Record<string, unknown>,
        tags: Array.isArray((row.metadataJson as { tags?: unknown[] } | null)?.tags)
          ? (((row.metadataJson as { tags?: unknown[] }).tags ?? []) as string[])
          : [],
        occurredAt:
          ((row.metadataJson as { occurredAt?: string } | null)?.occurredAt ??
            row.createdAt.toISOString()),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  }

  async update(req: RecordsUpdateRequest): Promise<RecordsUpdateResponse> {
    const row = await this.repository.updateRecord(req.recordId, {
      payloadJson:
        typeof req.payload !== "undefined"
          ? (req.payload as Prisma.InputJsonValue)
          : undefined,
      metadataJson:
        typeof req.tags !== "undefined"
          ? {
              tags: req.tags,
            } as Prisma.InputJsonValue
          : undefined,
    });
    if (!row) {
      throw new Error("record not found");
    }
    await this.auditLogService?.appendAuditLog({
      actorType: "system",
      action: "records.update",
      targetType: "record",
      targetId: row.id,
      detailJson: {
        hasPayload: typeof req.payload !== "undefined",
        hasTags: typeof req.tags !== "undefined",
      },
    });
    return { ok: true, recordId: row.id };
  }
}
