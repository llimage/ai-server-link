/**
 * Memory Core 记忆服务测试
 *
 * 所属模块：
 * * memory-core
 *
 * 文件作用：
 * * 验证 memory.write/search 与 topK 生效
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryMemoryStore } from "./memory-store";
import { MemoryService } from "./memory-service";

test("MemoryService should write and search with topK", async () => {
  const service = new MemoryService(new InMemoryMemoryStore());
  await service.write({
    userId: "u2",
    content: "I prefer morning exercise",
    tags: ["habit"],
  });
  await service.write({
    userId: "u2",
    content: "I prefer evening walk sometimes",
    tags: ["habit"],
  });

  const result = await service.search({
    userId: "u2",
    query: "prefer",
    topK: 1,
  });
  assert.equal(result.items.length, 1);
});

