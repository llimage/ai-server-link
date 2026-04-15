/**
 * Ingestion Core 向量化入口
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 定义 embedder 接口并提供 mock 实现
 *
 * 主要功能：
 * * Embedder 接口
 * * MockEmbedder 实现
 *
 * 依赖：
 * * search-core default profile
 *
 * 注意事项：
 * * 当前不调用真实 embedding provider
 */

import { getDefaultSearchProfile } from "search-core";

/**
 * 向量化接口
 */
export interface Embedder {
  embed(chunks: string[], profileId?: string): Promise<number[][]>;
}

/**
 * Mock 向量化实现
 */
export class MockEmbedder implements Embedder {
  /**
   * 生成 embeddings
   *
   * @param chunks 文本块
   * @param profileId 配置 ID（当前预留）
   * @returns 向量列表
   */
  async embed(chunks: string[], profileId?: string): Promise<number[][]> {
    void profileId;
    const dimension = getDefaultSearchProfile().embedding.dimension;
    const vectors = chunks.map((chunk) => buildStableVector(chunk, dimension));
    // TODO: replace mock embedder with real embedding provider in embedding phase
    return vectors;
  }
}

/**
 * 构造稳定向量
 *
 * @param text 输入文本
 * @param dimension 向量维度
 * @returns 稳定向量
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

