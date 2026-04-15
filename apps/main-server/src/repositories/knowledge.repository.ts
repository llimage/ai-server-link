/**
 * Knowledge 仓储
 *
 * 所属模块：
 * * main-server/repositories
 *
 * 文件作用：
 * * 封装 knowledge_sources/documents/chunks 表读写能力
 */

import type {
  KnowledgeChunk,
  KnowledgeDocument,
  KnowledgeSource,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../modules/database/prisma.service";

export class KnowledgeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSourceById(sourceId: string): Promise<KnowledgeSource | null> {
    return this.prisma.knowledgeSource.findUnique({ where: { id: sourceId } });
  }

  async upsertSource(data: Prisma.KnowledgeSourceCreateInput): Promise<KnowledgeSource> {
    return this.prisma.knowledgeSource.upsert({
      where: { id: data.id ?? "" },
      create: data,
      update: {
        tenantId: data.tenantId,
        fileUri: data.fileUri,
        status: data.status,
        metadataJson: data.metadataJson ?? undefined,
      },
    });
  }

  async updateSourceStatus(sourceId: string, status: string): Promise<void> {
    await this.prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: { status },
    });
  }

  async updateDocumentStatusBySource(sourceId: string, status: string): Promise<void> {
    await this.prisma.knowledgeDocument.updateMany({
      where: { sourceId },
      data: { status },
    });
  }

  async createSource(data: Prisma.KnowledgeSourceCreateInput): Promise<KnowledgeSource> {
    return this.prisma.knowledgeSource.create({ data });
  }

  async createDocument(data: Prisma.KnowledgeDocumentCreateInput): Promise<KnowledgeDocument> {
    return this.prisma.knowledgeDocument.create({ data });
  }

  async getDocumentBySourceId(sourceId: string): Promise<KnowledgeDocument | null> {
    return this.prisma.knowledgeDocument.findFirst({
      where: { sourceId },
      orderBy: { createdAt: "asc" },
    });
  }

  async createChunks(data: Prisma.KnowledgeChunkCreateManyInput[]): Promise<void> {
    if (data.length === 0) {
      return;
    }
    await this.prisma.knowledgeChunk.createMany({ data });
  }

  async deleteChunksByDocumentId(documentId: string): Promise<void> {
    await this.prisma.knowledgeChunk.deleteMany({ where: { documentId } });
  }

  async searchPublishedChunks(params: {
    query: string;
    tenantId?: string;
    topK: number;
  }): Promise<
    Array<{
      chunk: KnowledgeChunk;
      document: KnowledgeDocument;
      source: KnowledgeSource;
    }>
  > {
    const tokens = params.query.split(/\s+/).filter(Boolean);
    return this.prisma.knowledgeChunk.findMany({
      where: {
        document: {
          source: {
            status: "published",
            tenantId: params.tenantId,
          },
        },
        OR: tokens.length
          ? tokens.map((token) => ({
              chunkText: { contains: token, mode: "insensitive" },
            }))
          : [{ chunkText: { contains: params.query, mode: "insensitive" } }],
      },
      take: params.topK,
      include: {
        document: {
          include: { source: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }).then((rows) =>
      rows.map((row) => ({
        chunk: row,
        document: row.document,
        source: row.document.source,
      })),
    );
  }

  async listDocumentsBySourceId(sourceId: string): Promise<KnowledgeDocument[]> {
    return this.prisma.knowledgeDocument.findMany({
      where: { sourceId },
      orderBy: { createdAt: "asc" },
    });
  }

  async listChunksByDocumentId(documentId: string): Promise<KnowledgeChunk[]> {
    return this.prisma.knowledgeChunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: "asc" },
    });
  }

  async getPublishedChunkIds(chunkIds: string[]): Promise<string[]> {
    if (!chunkIds.length) {
      return [];
    }
    const rows = await this.prisma.knowledgeChunk.findMany({
      where: {
        id: { in: chunkIds },
        document: {
          source: {
            status: "published",
          },
        },
      },
      select: { id: true },
    });
    return rows.map((row) => row.id);
  }
}
