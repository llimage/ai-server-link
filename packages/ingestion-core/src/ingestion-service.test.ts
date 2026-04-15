/**
 * Ingestion 服务烟雾测试
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 验证 upload -> parse -> chunk -> embed -> index -> publish 完整闭环
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { MockEmbedder } from "./embedder/embedder";
import { InMemoryIngestionLogSink } from "./ingestion-log";
import { InMemoryIngestionTaskStore } from "./ingestion-task-store";
import { IngestionService } from "./ingestion-service";
import { MockIndexer } from "./indexer/indexer";
import { DefaultTextParser } from "./parser/text-parser";
import { MockPublisher } from "./publisher/publisher";
import { InMemoryKnowledgeSourceStore } from "./source-store";

test("IngestionService should complete full pipeline", async () => {
  const taskStore = new InMemoryIngestionTaskStore();
  const sourceStore = new InMemoryKnowledgeSourceStore();
  const service = new IngestionService({
    taskStore,
    sourceStore,
    logSink: new InMemoryIngestionLogSink(),
    parser: new DefaultTextParser(),
    embedder: new MockEmbedder(),
    indexer: new MockIndexer(),
    publisher: new MockPublisher(sourceStore),
  });

  const uploaded = await service.upload({
    rawText: "this is ingestion pipeline test text for chunking and embedding",
    metadata: { tenant_id: "demo" },
  });
  assert.equal(uploaded.status, "uploaded");

  const parsed = await service.parse(uploaded.sourceId, uploaded.taskId);
  assert.equal(parsed.status, "parsed");

  const chunked = await service.chunk(uploaded.sourceId, uploaded.taskId);
  assert.equal(chunked.status, "chunked");

  const embedded = await service.embed(uploaded.sourceId, uploaded.taskId);
  assert.equal(embedded.status, "embedded");

  const indexed = await service.index(uploaded.sourceId, uploaded.taskId);
  assert.equal(indexed.status, "indexed");

  const published = await service.publish(uploaded.sourceId, uploaded.taskId);
  assert.equal(published.status, "published");

  const task = await taskStore.get(uploaded.taskId);
  const source = await sourceStore.get(uploaded.sourceId);
  assert.equal(task?.stage, "published");
  assert.equal(source?.indexed, true);
  assert.equal(source?.published, true);
  assert.ok((source?.chunks?.length ?? 0) >= 1);
  assert.equal(source?.embeddings?.length, source?.chunks?.length);
});

