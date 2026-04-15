/**
 * Ingestion 数据库存储 - KnowledgeSourceStore
 *
 * 所属模块：
 * * main-server/modules/ingestion
 *
 * 文件作用：
 * * 以数据库表 knowledge_sources / knowledge_documents / knowledge_chunks 实现 KnowledgeSourceStore
 * * 提供 ingestion-core 在不同阶段读取与写入的数据支撑
 *
 * 主要功能：
 * * get/set/list/delete
 * * parsedText/chunks/embeddings 的持久化与还原
 *
 * 依赖：
 * * KnowledgeRepository：知识库表读写
 *
 * 注意事项：
 * * 内部字段保存到 metadataJson._ingestion
 * * chunk 数据落 knowledge_chunks 表
 */

import type { KnowledgeDocument } from "@prisma/client";
import type { KnowledgeSourceRecord, KnowledgeSourceStore } from "ingestion-core";
import { KnowledgeRepository } from "../../../repositories/knowledge.repository";

interface IngestionMeta {
  rawText?: string;
  parsedText?: string;
  embeddings?: number[][];
  mimeType?: string;
}

export class DatabaseKnowledgeSourceStore implements KnowledgeSourceStore {
  constructor(private readonly knowledgeRepository: KnowledgeRepository) {}

  /**
   * 获取知识源
   *
   * 功能说明：
   * 从数据库读取 knowledge_source，并恢复 ingestion-core 需要的字段
   *
   * @param sourceId 知识源 ID
   * @returns 知识源记录或 null
   */
  async get(sourceId: string): Promise<KnowledgeSourceRecord | null> {
    const source = await this.knowledgeRepository.getSourceById(sourceId);
    if (!source) {
      return null;
    }
    const metadata = (source.metadataJson as Record<string, unknown> | null) ?? {};
    const ingestionMeta = (metadata["_ingestion"] as IngestionMeta | undefined) ?? {};
    const chunks = await this.loadChunks(sourceId);
    return {
      sourceId: source.id,
      rawText: ingestionMeta.rawText,
      fileUri: source.fileUri ?? undefined,
      mimeType: ingestionMeta.mimeType,
      metadata: stripInternalMetadata(metadata),
      parsedText: ingestionMeta.parsedText,
      chunks: chunks.length ? chunks : undefined,
      embeddings: ingestionMeta.embeddings,
      indexed: source.status === "indexed" || source.status === "published",
      published: source.status === "published",
      createdAt: source.createdAt.toISOString(),
      updatedAt: source.updatedAt.toISOString(),
    };
  }

  /**
   * 写入知识源
   *
   * 功能说明：
   * 将 ingestion-core 产生的数据同步到数据库
   *
   * @param record 知识源记录
   * @returns void
   */
  async set(record: KnowledgeSourceRecord): Promise<void> {
    const metadataJson = buildMetadata(record);
    const existing = await this.knowledgeRepository.getSourceById(record.sourceId);
    const source = await this.knowledgeRepository.upsertSource({
      id: record.sourceId,
      tenantId: resolveTenantId(record.metadata),
      fileUri: record.fileUri ?? undefined,
      status: existing?.status ?? "uploaded",
      metadataJson,
    });

    if (record.parsedText) {
      await this.ensureDocument(source.id, record.parsedText, record.metadata);
    }

    if (record.chunks?.length && !record.embeddings?.length) {
      const document = await this.ensureDocument(source.id, record.parsedText ?? "", record.metadata);
      await this.knowledgeRepository.deleteChunksByDocumentId(document.id);
      await this.knowledgeRepository.createChunks(
        record.chunks.map((chunkText, index) => ({
          documentId: document.id,
          chunkIndex: index,
          chunkText,
          tokenCount: estimateTokens(chunkText),
          metadataJson: buildChunkMetadata(record.metadata),
        })),
      );
    }
  }

  /**
   * 列出全部知识源
   *
   * @returns 知识源记录列表
   */
  async list(): Promise<KnowledgeSourceRecord[]> {
    return [];
  }

  /**
   * 删除知识源
   *
   * @param sourceId 知识源 ID
   * @returns void
   */
  async delete(sourceId: string): Promise<void> {
    // 本阶段不提供删除能力
    void sourceId;
  }

  /**
   * 读取当前 source 的 chunks
   *
   * 功能说明：
   * 从 knowledge_chunks 表中恢复 chunkText 列表
   *
   * @param sourceId 知识源 ID
   * @returns chunk 列表
   */
  private async loadChunks(sourceId: string): Promise<string[]> {
    const document = await this.knowledgeRepository.getDocumentBySourceId(sourceId);
    if (!document) {
      return [];
    }
    const chunks = await this.knowledgeRepository.listChunksByDocumentId(document.id);
    return chunks.map((chunk) => chunk.chunkText);
  }

  /**
   * 确保文档存在
   *
   * 功能说明：
   * 如果 source 尚未创建 document，则自动补建
   *
   * @param sourceId 知识源 ID
   * @param parsedText 解析文本
   * @param metadata 元数据
   * @returns KnowledgeDocument
   */
  private async ensureDocument(
    sourceId: string,
    parsedText: string,
    metadata?: Record<string, unknown>,
  ): Promise<KnowledgeDocument> {
    const existing = await this.knowledgeRepository.getDocumentBySourceId(sourceId);
    if (existing) {
      return existing;
    }
    const title =
      typeof metadata?.title === "string" && metadata.title.trim()
        ? metadata.title.trim()
        : parsedText.split("\n")[0]?.slice(0, 64);
    return this.knowledgeRepository.createDocument({
      sourceId,
      title: title || "Untitled",
      status: "parsed",
      metadataJson: {
        ...(metadata ?? {}),
        parsedText,
      },
    });
  }
}

/**
 * 计算简易 token 数
 *
 * 功能说明：
 * 使用空格分词估算 token 数量
 *
 * @param text 文本
 * @returns token 数
 */
function estimateTokens(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * 生成数据库 metadataJson
 *
 * 功能说明：
 * 在 metadataJson 中保存 ingestion 内部字段
 *
 * @param record 知识源记录
 * @returns metadataJson
 */
function buildMetadata(record: KnowledgeSourceRecord): Record<string, unknown> {
  return {
    ...(record.metadata ?? {}),
    _ingestion: {
      rawText: record.rawText,
      parsedText: record.parsedText,
      embeddings: record.embeddings,
      mimeType: record.mimeType,
    },
  };
}

/**
 * 生成 chunk 元数据
 *
 * 功能说明：
 * 保留 tenant 等筛选字段
 *
 * @param metadata 元数据
 * @returns metadataJson
 */
function buildChunkMetadata(
  metadata?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  return metadata ? { ...metadata } : undefined;
}

/**
 * 去掉内部字段
 *
 * 功能说明：
 * 读取 metadataJson 时移除 _ingestion 字段
 *
 * @param metadata 元数据
 * @returns 过滤后的元数据
 */
function stripInternalMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const clone = { ...metadata };
  delete clone["_ingestion"];
  return clone;
}

/**
 * 解析 tenantId
 *
 * 功能说明：
 * 从 metadata 中读取 tenant_id，若不存在则返回 default
 *
 * @param metadata 元数据
 * @returns tenantId
 */
function resolveTenantId(metadata?: Record<string, unknown>): string {
  const tenant =
    typeof metadata?.tenant_id === "string"
      ? metadata.tenant_id
      : typeof metadata?.tenantId === "string"
        ? metadata.tenantId
        : "default";
  return tenant;
}
