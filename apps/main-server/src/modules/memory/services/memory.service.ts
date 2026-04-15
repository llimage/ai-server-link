/**
 * Memory 持久化服务
 *
 * 所属模块：
 * * main-server/modules/memory
 *
 * 文件作用：
 * * 基于 MemoryRepository 实现 memory.write/search/summarize 协议
 *
 * 依赖：
 * * MemoryRepository
 * * AuditLogService（可选）
 */

import type { MemoryRepository } from "../../../repositories/memory.repository";
import type {
  MemorySearchRequest,
  MemorySearchResponse,
  MemorySummarizeRequest,
  MemorySummarizeResponse,
  MemoryWriteRequest,
  MemoryWriteResponse,
} from "protocol";
import type { AuditLogService } from "../../audit/services/audit-log.service";

export class PersistentMemoryService {
  constructor(
    private readonly repository: MemoryRepository,
    private readonly auditLogService?: AuditLogService,
  ) {}

  async write(req: MemoryWriteRequest): Promise<MemoryWriteResponse> {
    const row = await this.repository.createMemory({
      userId: req.userId,
      content: req.content,
      tagsJson: (req.tags ?? []) as never,
      source: req.source,
    });
    await this.auditLogService?.appendAuditLog({
      actorType: "user",
      actorId: req.userId,
      action: "memory.write",
      targetType: "memory",
      targetId: row.id,
      detailJson: {
        kind: req.kind ?? "note",
      },
    });
    return {
      ok: true,
      memoryId: row.id,
    };
  }

  async search(req: MemorySearchRequest): Promise<MemorySearchResponse> {
    const rows = await this.repository.searchByUserId(
      req.userId,
      req.query,
      req.tags,
      req.topK ?? 5,
    );
    return {
      items: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        content: row.content,
        kind: "note",
        source: row.source ?? undefined,
        tags: Array.isArray(row.tagsJson) ? (row.tagsJson as string[]) : undefined,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  }

  async summarize(req: MemorySummarizeRequest): Promise<MemorySummarizeResponse> {
    const rows = await this.repository.searchByUserId(req.userId, "", undefined, req.limit ?? 10);
    const summary = rows.map((item) => item.content).join(" ").slice(0, 300);
    await this.repository.createSummary({
      userId: req.userId,
      summary,
      metadataJson: {
        source: "memory.summarize",
        count: rows.length,
      },
    });
    await this.auditLogService?.appendAuditLog({
      actorType: "user",
      actorId: req.userId,
      action: "memory.summarize",
      targetType: "memory_summary",
      detailJson: {
        count: rows.length,
      },
    });
    return { summary };
  }
}

