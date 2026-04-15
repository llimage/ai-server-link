/**
 * User Meta 持久化测试
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { UserMetaRepository } from "../../../repositories/user-meta.repository";
import { PersistentUserMetaService } from "../services/user-meta.service";
import { hasDatabaseUrl, withPrisma } from "../../../tests/persistence-test.utils";

test("user-meta persistence: write and query", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  await withPrisma(async (prisma) => {
    const service = new PersistentUserMetaService(new UserMetaRepository(prisma));
    const userId = `user_persist_meta_${Date.now()}`;
    const write = await service.write({
      userId,
      items: [{ key: "wakeup_time", value: "07:30", tags: ["habit"] }],
    });
    assert.equal(write.ok, true);
    const queried = await service.query({
      userId,
      keys: ["wakeup_time"],
    });
    assert.ok(queried.items.length >= 1);
  });
});
