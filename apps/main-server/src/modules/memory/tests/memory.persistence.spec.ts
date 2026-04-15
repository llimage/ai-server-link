/**
 * Memory 持久化测试
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { MemoryRepository } from "../../../repositories/memory.repository";
import { PersistentMemoryService } from "../services/memory.service";
import { hasDatabaseUrl, withPrisma } from "../../../tests/persistence-test.utils";

test("memory persistence: write search summarize", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  await withPrisma(async (prisma) => {
    const service = new PersistentMemoryService(new MemoryRepository(prisma));
    const created = await service.write({
      userId: "user_persist_memory",
      content: "I like morning workout",
      tags: ["habit"],
    });
    assert.equal(created.ok, true);
    const searched = await service.search({
      userId: "user_persist_memory",
      query: "morning",
      topK: 3,
    });
    assert.ok(searched.items.length >= 1);
    const summarized = await service.summarize({
      userId: "user_persist_memory",
      limit: 5,
    });
    assert.equal(typeof summarized.summary, "string");
  });
});

