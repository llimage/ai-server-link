/**
 * Plans 持久化测试
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { PlansRepository } from "../../../repositories/plans.repository";
import { PersistentPlansService } from "../services/plans.service";
import { hasDatabaseUrl, withPrisma } from "../../../tests/persistence-test.utils";

test("plans persistence: create update status query", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  await withPrisma(async (prisma) => {
    const service = new PersistentPlansService(new PlansRepository(prisma));
    const created = await service.write({
      userId: "user_persist_plans",
      space: "general",
      type: "routine",
      payload: { task: "drink water" },
    });
    await service.activate({ planId: created.planId });
    const queried = await service.query({ userId: "user_persist_plans", limit: 10 });
    const plan = queried.items.find((item) => item.planId === created.planId);
    assert.ok(plan);
    assert.equal(plan?.status, "active");
  });
});

