/**
 * Records + Plans 内部路由测试
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 验证 records/plans internal routes 的最小闭环能力
 *
 * 主要功能：
 * * records.write/query/update
 * * plans.write/query/activate/pause/expand
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMainServer } from "./app";
import { hasDatabaseUrl } from "./tests/persistence-test.utils";

/**
 * 验证 records 内部路由闭环
 */
test("records internal routes should support write/query/update", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const userId = `u_records_${Date.now()}`;
  const space = `general_${Date.now()}`;
  const type = `note_${Date.now()}`;
  const { app } = buildMainServer();
  try {
    const writeRes = await app.inject({
      method: "POST",
      url: "/internal/records/write",
      payload: {
        userId,
        space,
        type,
        payload: { mood: "good" },
      },
    });
    assert.equal(writeRes.statusCode, 200);
    const writeBody = writeRes.json() as { ok: true; recordId: string };
    assert.ok(writeBody.recordId);

    const queryRes = await app.inject({
      method: "POST",
      url: "/internal/records/query",
      payload: {
        userId,
        space,
      },
    });
    assert.equal(queryRes.statusCode, 200);
    const queryBody = queryRes.json() as { items: Array<{ recordId: string }> };
    assert.ok(queryBody.items.some((item) => item.recordId === writeBody.recordId));

    const updateRes = await app.inject({
      method: "POST",
      url: "/internal/records/update",
      payload: {
        recordId: writeBody.recordId,
        payload: { mood: "great" },
      },
    });
    assert.equal(updateRes.statusCode, 200);
    const updateBody = updateRes.json() as { ok: true; recordId: string };
    assert.equal(updateBody.recordId, writeBody.recordId);
  } finally {
    await app.close();
  }
});

/**
 * 验证 plans 内部路由闭环
 */
test("plans internal routes should support write/query/activate/pause/expand", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const userId = `u_plans_${Date.now()}`;
  const space = `general_${Date.now()}`;
  const type = `routine_${Date.now()}`;
  const { app } = buildMainServer();
  try {
    const writeRes = await app.inject({
      method: "POST",
      url: "/internal/plans/write",
      payload: {
        userId,
        space,
        type,
        payload: { title: "morning routine" },
      },
    });
    assert.equal(writeRes.statusCode, 200);
    const writeBody = writeRes.json() as { ok: true; planId: string };
    assert.ok(writeBody.planId);

    const activateRes = await app.inject({
      method: "POST",
      url: "/internal/plans/activate",
      payload: { planId: writeBody.planId },
    });
    assert.equal(activateRes.statusCode, 200);

    const pauseRes = await app.inject({
      method: "POST",
      url: "/internal/plans/pause",
      payload: { planId: writeBody.planId },
    });
    assert.equal(pauseRes.statusCode, 200);

    const queryRes = await app.inject({
      method: "POST",
      url: "/internal/plans/query",
      payload: {
        userId,
      },
    });
    assert.equal(queryRes.statusCode, 200);
    const queryBody = queryRes.json() as { items: Array<{ planId: string }> };
    assert.ok(queryBody.items.some((item) => item.planId === writeBody.planId));

    const expandRes = await app.inject({
      method: "POST",
      url: "/internal/plans/expand",
      payload: {
        planId: writeBody.planId,
        date: "2026-04-13",
      },
    });
    assert.equal(expandRes.statusCode, 200);
    const expandBody = expandRes.json() as {
      planId: string;
      items: unknown[];
    };
    assert.equal(expandBody.planId, writeBody.planId);
    assert.ok(expandBody.items.length >= 1);
  } finally {
    await app.close();
  }
});
