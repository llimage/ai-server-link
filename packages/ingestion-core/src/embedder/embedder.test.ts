/**
 * Ingestion 向量化测试
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 验证向量数量与维度正确
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { getDefaultSearchProfile } from "search-core";
import { MockEmbedder } from "./embedder";

test("MockEmbedder should return vectors matching chunks count and dimension", async () => {
  const embedder = new MockEmbedder();
  const vectors = await embedder.embed(["c1", "c2", "c3"]);
  const dimension = getDefaultSearchProfile().embedding.dimension;
  assert.equal(vectors.length, 3);
  assert.equal(vectors[0]?.length, dimension);
  assert.equal(vectors[1]?.length, dimension);
});

