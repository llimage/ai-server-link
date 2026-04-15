/**
 * Search Core 服务编排测试
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 验证 SearchService 在不同 mode 下的调用路径与日志行为
 *
 * 主要功能：
 * * keyword 模式仅调用 keyword
 * * vector 模式仅调用 vector
 * * hybrid 模式调用双侧并合并
 * * rerank 开关生效
 * * retrieval log 写入
 *
 * 依赖：
 * * node:test
 * * search-service
 * * retrieval-log
 *
 * 注意事项：
 * * 使用 stub adapter 验证编排逻辑，不依赖真实后端
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import type { SearchProfile } from "./search-profile";
import type { KeywordSearchAdapter } from "./keyword-search";
import type { VectorSearchAdapter } from "./vector-search";
import type { RerankAdapter } from "./rerank";
import { InMemoryRetrievalLogSink } from "./retrieval-log";
import { SearchService } from "./search-service";

/**
 * 构建基础 profile
 *
 * @param mode 默认模式
 * @param rerankEnabled 是否启用 rerank
 * @returns SearchProfile
 */
function buildProfile(
  mode: "keyword" | "vector" | "hybrid",
  rerankEnabled = false,
): SearchProfile {
  return {
    profileId: "test",
    embedding: { model: "m", dimension: 3 },
    chunk: { targetTokens: 1, maxTokens: 2, overlapTokens: 0 },
    partition: { primary: ["tenant_id"] },
    search: {
      defaultMode: mode,
      defaultTopK: 5,
      vectorWeight: 0.5,
      keywordWeight: 0.5,
      rerankEnabled,
      rerankTopN: 2,
    },
  };
}

/**
 * 创建可计数的 stub adapter
 *
 * @returns adapter 与计数器
 */
function createAdapters(): {
  keyword: KeywordSearchAdapter;
  vector: VectorSearchAdapter;
  rerank: RerankAdapter;
  calls: { keyword: number; vector: number; rerank: number };
} {
  const calls = { keyword: 0, vector: 0, rerank: 0 };

  const keyword: KeywordSearchAdapter = {
    async search() {
      calls.keyword += 1;
      return [{ id: "k1", score: 0.8, text: "k1", metadata: {} }];
    },
  };

  const vector: VectorSearchAdapter = {
    async search() {
      calls.vector += 1;
      return [{ id: "v1", score: 0.7, text: "v1", metadata: {} }];
    },
  };

  const rerank: RerankAdapter = {
    async rerank(params) {
      calls.rerank += 1;
      return params.hits;
    },
  };

  return { keyword, vector, rerank, calls };
}

/**
 * 测试 keyword 模式调用路径
 */
test("SearchService keyword mode should call only keyword adapter", async () => {
  const adapters = createAdapters();
  const log = new InMemoryRetrievalLogSink();
  const service = new SearchService({
    keywordAdapter: adapters.keyword,
    vectorAdapter: adapters.vector,
    rerankAdapter: adapters.rerank,
    retrievalLogSink: log,
    searchProfileProvider: () => buildProfile("keyword"),
  });

  await service.query({ space: "knowledge", query: "Hello", mode: "keyword" });
  assert.equal(adapters.calls.keyword, 1);
  assert.equal(adapters.calls.vector, 0);
});

/**
 * 测试 vector 模式调用路径
 */
test("SearchService vector mode should call only vector adapter", async () => {
  const adapters = createAdapters();
  const log = new InMemoryRetrievalLogSink();
  const service = new SearchService({
    keywordAdapter: adapters.keyword,
    vectorAdapter: adapters.vector,
    rerankAdapter: adapters.rerank,
    retrievalLogSink: log,
    searchProfileProvider: () => buildProfile("vector"),
  });

  await service.query({ space: "knowledge", query: "Hello", mode: "vector" });
  assert.equal(adapters.calls.keyword, 0);
  assert.equal(adapters.calls.vector, 1);
});

/**
 * 测试 hybrid 模式调用路径
 */
test("SearchService hybrid mode should call both adapters", async () => {
  const adapters = createAdapters();
  const log = new InMemoryRetrievalLogSink();
  const service = new SearchService({
    keywordAdapter: adapters.keyword,
    vectorAdapter: adapters.vector,
    rerankAdapter: adapters.rerank,
    retrievalLogSink: log,
    searchProfileProvider: () => buildProfile("hybrid"),
  });

  await service.query({ space: "knowledge", query: "Hello", mode: "hybrid" });
  assert.equal(adapters.calls.keyword, 1);
  assert.equal(adapters.calls.vector, 1);
});

/**
 * 测试 rerank 与日志写入
 */
test("SearchService should apply rerank and write retrieval log", async () => {
  const adapters = createAdapters();
  const log = new InMemoryRetrievalLogSink();
  const service = new SearchService({
    keywordAdapter: adapters.keyword,
    vectorAdapter: adapters.vector,
    rerankAdapter: adapters.rerank,
    retrievalLogSink: log,
    searchProfileProvider: () => buildProfile("hybrid", true),
  });

  await service.query({
    space: "knowledge",
    query: "please search hello",
    mode: "hybrid",
  });
  assert.equal(adapters.calls.rerank, 1);
  const records = await log.list();
  assert.equal(records.length, 1);
  assert.equal(records[0]?.space, "knowledge");
});

