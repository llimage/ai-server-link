/**
 * Embedding Core - 确定性向量测试
 *
 * 所属模块：
 * * embedding-core
 *
 * 文件作用：
 * * 验证 deterministic provider 输出可复现向量
 *
 * 主要功能：
 * * same input => same vector
 * * dimension 符合期望
 *
 * 依赖：
 * * node:test
 * * DeterministicEmbeddingProvider
 *
 * 注意事项：
 * * 仅验证稳定性，不评估语义质量
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { DeterministicEmbeddingProvider } from "./deterministic-embedding-provider";

test("deterministic embedding provider should return stable vectors", async () => {
  const provider = new DeterministicEmbeddingProvider();
  const first = await provider.embed({
    texts: ["hello world", "hello world"],
    dimension: 8,
  });
  const second = await provider.embed({
    texts: ["hello world", "hello world"],
    dimension: 8,
  });
  assert.equal(first.vectors.length, 2);
  assert.equal(first.vectors[0].length, 8);
  assert.deepEqual(first.vectors, second.vectors);
});
