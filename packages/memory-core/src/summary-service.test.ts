/**
 * Memory Core 摘要服务测试
 *
 * 所属模块：
 * * memory-core
 *
 * 文件作用：
 * * 验证 summarize 在有内容/无内容场景的返回
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryMemoryStore } from "./memory-store";
import { MemoryService } from "./memory-service";
import { SummaryService } from "./summary-service";

test("SummaryService should return non-empty summary when memory exists", async () => {
  const store = new InMemoryMemoryStore();
  const memoryService = new MemoryService(store);
  const summaryService = new SummaryService(store);
  await memoryService.write({
    userId: "u3",
    content: "I prefer morning exercise",
  });
  const response = await summaryService.summarize({ userId: "u3", limit: 5 });
  assert.ok(response.summary.length > 0);
});

test("SummaryService should return empty summary when no memory", async () => {
  const store = new InMemoryMemoryStore();
  const summaryService = new SummaryService(store);
  const response = await summaryService.summarize({ userId: "empty-user", limit: 5 });
  assert.equal(response.summary, "");
});

