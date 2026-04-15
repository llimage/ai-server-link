/**
 * Ingestion 向量提供器适配
 *
 * 所属模块：
 * * main-server/modules/ingestion
 *
 * 文件作用：
 * * 将 embedding-core provider 适配为 ingestion-core Embedder
 * * 统一向量维度与稳定性策略
 *
 * 主要功能：
 * * DeterministicEmbedder
 *
 * 依赖：
 * * ingestion-core Embedder
 * * embedding-core DeterministicEmbeddingProvider
 * * search-core profile
 *
 * 注意事项：
 * * 当前为本地可运行实现，后续可替换为真实 provider
 */

import { DeterministicEmbeddingProvider } from "embedding-core";
import type { Embedder } from "ingestion-core";
import { getDefaultSearchProfile } from "search-core";

/**
 * 确定性 Embedder
 */
export class DeterministicEmbedder implements Embedder {
  private readonly provider = new DeterministicEmbeddingProvider();

  /**
   * 生成向量
   *
   * 功能说明：
   * * 使用 deterministic provider 生成稳定向量
   *
   * @param chunks 文本块
   * @param profileId profileId（预留）
   * @returns 向量列表
   */
  async embed(chunks: string[], profileId?: string): Promise<number[][]> {
    void profileId;
    const dimension = getDefaultSearchProfile().embedding.dimension;
    const result = await this.provider.embed({
      texts: chunks,
      dimension,
      providerName: "deterministic",
    });
    return result.vectors;
  }
}
