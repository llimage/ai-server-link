/**
 * User Meta 持久化服务
 *
 * 所属模块：
 * * main-server/modules/user-meta
 *
 * 文件作用：
 * * 基于 UserMetaRepository 实现 user.meta.write/query 协议
 *
 * 依赖：
 * * UserMetaRepository
 * * AuditLogService（可选）
 */

import type { UserMetaRepository } from "../../../repositories/user-meta.repository";
import type {
  UserMetaQueryRequest,
  UserMetaQueryResponse,
  UserMetaWriteRequest,
  UserMetaWriteResponse,
} from "protocol";
import type { AuditLogService } from "../../audit/services/audit-log.service";

export class PersistentUserMetaService {
  constructor(
    private readonly repository: UserMetaRepository,
    private readonly auditLogService?: AuditLogService,
  ) {}

  async write(req: UserMetaWriteRequest): Promise<UserMetaWriteResponse> {
    await this.repository.upsertMany(
      req.items.map((item) => ({
        userId: req.userId,
        key: item.key,
        valueJson: item.value as never,
        confidence: item.confidence ?? null,
        tagsJson: (item.tags ?? []) as never,
      })),
    );
    await this.auditLogService?.appendAuditLog({
      actorType: "user",
      actorId: req.userId,
      action: "user.meta.write",
      targetType: "user_meta",
      detailJson: { written: req.items.length },
    });
    return {
      ok: true,
      written: req.items.length,
    };
  }

  async query(req: UserMetaQueryRequest): Promise<UserMetaQueryResponse> {
    const rows = await this.repository.findByUserIdAndKeys(req.userId, req.keys);
    const filtered = rows.filter((row) => {
      if (!req.tags || req.tags.length === 0) {
        return true;
      }
      const tags = Array.isArray(row.tagsJson) ? (row.tagsJson as string[]) : [];
      return req.tags.every((tag) => tags.includes(tag));
    });
    return {
      items: filtered.map((row) => ({
        id: row.id,
        userId: row.userId,
        key: row.key,
        value: row.valueJson,
        confidence: row.confidence ?? undefined,
        tags: Array.isArray(row.tagsJson) ? (row.tagsJson as string[]) : undefined,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  }
}

