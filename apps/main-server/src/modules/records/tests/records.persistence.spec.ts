/**
 * Records 持久化测试
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { RecordsRepository } from "../../../repositories/records.repository";
import { PersistentRecordsService } from "../services/records.service";
import { hasDatabaseUrl, withPrisma } from "../../../tests/persistence-test.utils";

test("records persistence: create and query", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  await withPrisma(async (prisma) => {
    const service = new PersistentRecordsService(new RecordsRepository(prisma));
    const write = await service.write({
      userId: "user_persist_records",
      space: "general",
      type: "note",
      payload: { value: "hello" },
    });
    assert.equal(write.ok, true);
    const queried = await service.query({
      userId: "user_persist_records",
      limit: 5,
    });
    assert.ok(queried.items.some((item) => item.recordId === write.recordId));
  });
});

