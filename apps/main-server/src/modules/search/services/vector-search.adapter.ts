import { DeterministicEmbeddingProvider } from "embedding-core";
import type { SearchProfile } from "search-core";
import type { NormalizedFilters, NormalizedQuery, VectorHit, VectorSearchAdapter } from "search-core";
import { KnowledgeRepository } from "../../../repositories/knowledge.repository";
import { VectorIndexRepository } from "../../../repositories/vector-index.repository";

export class LanceDbVectorSearchAdapter implements VectorSearchAdapter {
  private readonly provider = new DeterministicEmbeddingProvider();

  constructor(
    private readonly knowledgeRepository: KnowledgeRepository,
    private readonly vectorRepository: VectorIndexRepository,
  ) {}

  async search(params: {
    space: string;
    query: NormalizedQuery;
    filters: NormalizedFilters;
    topK: number;
    profile: SearchProfile;
  }): Promise<VectorHit[]> {
    const dimension = params.profile.embedding.dimension;

    const embedding = await this.provider.embed({
      texts: [params.query.normalized],
      dimension,
      providerName: "deterministic",
    });

    const tenantId = resolveTenantId(params.filters.values);

    let rawHits: any[] = [];

    try {
      rawHits = await this.vectorRepository.query({
        vector: embedding.vectors[0],
        topK: params.topK,
        tenantId,
      });
    } catch (err: any) {
      console.warn("[vector-search] query failed:", err?.message || err);
      return [];
    }

    if (!rawHits.length) {
      return [];
    }

    const publishedIds = await this.knowledgeRepository.getPublishedChunkIds(
      rawHits.map((hit) => hit.chunkId),
    );

    const publishedSet = new Set(publishedIds);

    return rawHits
      .filter((hit) => publishedSet.has(hit.chunkId))
      .map((hit) => ({
        id: hit.chunkId,
        score: hit.score,
        text: hit.text,
        metadata: {
          ...hit.metadata,
          sourceId: hit.sourceId,
          documentId: hit.documentId,
          chunkId: hit.chunkId,
        },
      }));
  }
}

function resolveTenantId(filters: Record<string, unknown>): string | undefined {
  if (typeof filters.tenant_id === "string") return filters.tenant_id;
  if (typeof filters.tenantId === "string") return filters.tenantId;
  return undefined;
}



