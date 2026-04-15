/**
 * Vector Store Core - LanceDB 测试
 *
 * 所属模块：
 * * vector-store-core
 *
 * 文件作用：
 * * 验证 LanceDB 写入与检索可用
 *
 * 主要功能：
 * * upsert -> query
 *
 * 依赖：
 * * node:test
 * * LanceDbVectorStore
 *
 * 注意事项：
 * * 使用本地测试目录，避免污染正式数据
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { LanceDbVectorStore } from "./lancedb-vector-store";

test("lancedb vector store should upsert and query", async () => {
  const baseDir = join(process.cwd(), "storage", "lancedb-test");
  mkdirSync(baseDir, { recursive: true });
  const store = new LanceDbVectorStore({
    uri: baseDir,
    tableName: `chunks_${Date.now()}`,
  });
  await store.upsert([
    {
      chunkId: "chunk-1",
      documentId: "doc-1",
      sourceId: "src-1",
      tenantId: "tenant-1",
      text: "hello vector",
      embedding: [0.1, 0.2, 0.3],
      metadata: { tag: "test" },
    },
  ]);
  const results = await store.query({
    vector: [0.1, 0.2, 0.3],
    topK: 3,
    tenantId: "tenant-1",
  });
  assert.ok(results.length >= 1);
  assert.equal(results[0].chunkId, "chunk-1");
});
