/**
 * Plans Core 服务测试
 *
 * 所属模块：
 * * plans-core
 *
 * 文件作用：
 * * 验证 plans.write/query/activate/pause/expand 的最小闭环能力
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { PlansService } from "./plans-service";
import { InMemoryPlansStore } from "./plans-store";

/**
 * 验证计划写入与查询
 */
test("PlansService should write and query plans", async () => {
  const service = new PlansService(new InMemoryPlansStore());
  const write = await service.write({
    userId: "u_plan",
    space: "general",
    type: "routine",
    payload: { title: "morning routine" },
  });
  assert.equal(write.ok, true);
  assert.ok(write.planId.startsWith("plan_"));

  const queried = await service.query({ userId: "u_plan" });
  assert.equal(queried.items.length, 1);
  assert.equal(queried.items[0]?.status, "draft");
});

/**
 * 验证计划状态切换与展开
 */
test("PlansService should activate, pause and expand plan", async () => {
  const service = new PlansService(new InMemoryPlansStore());
  const write = await service.write({
    userId: "u_plan",
    space: "general",
    type: "routine",
    payload: {
      title: "morning routine",
      scheduleItems: [{ time: "08:00" }, { time: "20:00" }],
    },
  });

  const activated = await service.activate({ planId: write.planId });
  assert.equal(activated.ok, true);
  const afterActivate = await service.query({
    userId: "u_plan",
    status: "active",
  });
  assert.equal(afterActivate.items.length, 1);

  const paused = await service.pause({ planId: write.planId });
  assert.equal(paused.ok, true);
  const afterPause = await service.query({
    userId: "u_plan",
    status: "paused",
  });
  assert.equal(afterPause.items.length, 1);

  const expanded = await service.expand({
    planId: write.planId,
    date: "2026-04-13",
  });
  assert.equal(expanded.planId, write.planId);
  assert.equal(expanded.items.length, 2);
});

