/**
 * Embedding Core - 确定性向量提供器
 *
 * 所属模块：
 * * embedding-core
 *
 * 文件作用：
 * * 提供本地可运行、可复现的 embedding 实现
 * * 用于测试与非真实 provider 阶段的向量生成
 *
 * 主要功能：
 * * DeterministicEmbeddingProvider
 *
 * 依赖：
 * * embedding-provider
 *
 * 注意事项：
 * * 该实现不调用真实模型，只用于稳定测试
 */

import type { EmbeddingProvider, EmbeddingRequest, EmbeddingResult } from "./embedding-provider";

/**
 * 确定性向量提供器
 */
export class DeterministicEmbeddingProvider implements EmbeddingProvider {
  /**
   * 生成向量
   *
   * 功能说明：
   * * 使用稳定哈希生成固定维度向量
   *
   * @param request embedding 请求
   * @returns embedding 结果
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResult> {
    const vectors = request.texts.map((text) =>
      buildStableVector(text, request.dimension),
    );
    return {
      vectors,
      dimension: request.dimension,
      providerName: request.providerName ?? "deterministic",
    };
  }
}

/**
 * 构造稳定向量
 *
 * 功能说明：
 * * 使用简单哈希生成固定长度向量，保证同输入可复现
 *
 * @param text 输入文本
 * @param dimension 向量维度
 * @returns 向量
 */
function buildStableVector(text: string, dimension: number): number[] {
  const seed = simpleHash(text);
  const vector: number[] = [];
  for (let index = 0; index < dimension; index += 1) {
    const value = ((seed + (index + 1) * 1315423911) >>> 0) % 1000;
    vector.push(value / 1000);
  }
  return vector;
}

/**
 * 简单哈希
 *
 * 功能说明：
 * * 为向量生成提供稳定种子
 *
 * @param text 输入文本
 * @returns hash 值
 */
function simpleHash(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
