/**
 * Ingestion 鍚戦噺绱㈠紩鍐欏叆鍣? *
 * 鎵€灞炴ā鍧楋細
 * * main-server/modules/ingestion
 *
 * 鏂囦欢浣滅敤锛? * * 灏?ingestion-core index 闃舵鍐欏叆鍚戦噺搴? * * 璐熻矗浠庢暟鎹簱璇诲彇 chunk 缁撴瀯骞跺啓鍏?LanceDB
 *
 * 涓昏鍔熻兘锛? * * VectorIndexWriter
 *
 * 渚濊禆锛? * * ingestion-core Indexer
 * * KnowledgeRepository
 * * VectorIndexRepository
 *
 * 娉ㄦ剰浜嬮」锛? * * 閫氳繃 chunkIndex 瀵归綈 embeddings
 * * 浠呭啓鍏ワ紝涓嶅仛涓氬姟杩囨护
 */

import type { Indexer } from "ingestion-core";
import type { VectorRecord } from "vector-store-core";
import { KnowledgeRepository } from "../../../repositories/knowledge.repository";
import { VectorIndexRepository } from "../../../repositories/vector-index.repository";

/**
 * 鍚戦噺绱㈠紩鍐欏叆鍣? */
export class VectorIndexWriter implements Indexer {
  constructor(
    private readonly knowledgeRepository: KnowledgeRepository,
    private readonly vectorRepository: VectorIndexRepository,
  ) {}

  /**
   * 鍐欏叆鍚戦噺绱㈠紩
   *
   * 鍔熻兘璇存槑锛?   * * 鏍规嵁 sourceId 璇诲彇 chunk 涓?document 淇℃伅
   * * 瀵归綈 embeddings 骞跺啓鍏ュ悜閲忓簱
   *
   * @param params 绱㈠紩鍙傛暟
   * @returns void
   */
  async index(params: {
    sourceId: string;
    chunks: string[];
    embeddings: number[][];
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const source = await this.knowledgeRepository.getSourceById(params.sourceId);
    if (!source) {
      throw new Error("Source not found for vector index");
    }
    const document = await this.knowledgeRepository.getDocumentBySourceId(params.sourceId);
    if (!document) {
      throw new Error("Document not found for vector index");
    }
    const chunks = await this.knowledgeRepository.listChunksByDocumentId(document.id);
    if (!chunks.length) {
      throw new Error("No chunks found for vector index");
    }
    const length = Math.min(chunks.length, params.embeddings.length);
    const records: VectorRecord[] = [];
    for (let index = 0; index < length; index += 1) {
      const chunk = chunks[index];
      const embedding = params.embeddings[index];
      records.push({
        chunkId: chunk.id,
        documentId: document.id,
        sourceId: source.id,
        tenantId: source.tenantId,
        text: chunk.chunkText,
        embedding,
        metadata: (chunk.metadataJson as Record<string, unknown> | undefined) ?? params.metadata,
      });
    }
    await this.vectorRepository.upsert(records);
  }
}

