/**
 * Tool Core 内部工具路由测试
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 验证 search.query 工具注册与执行接口可用
 *
 * 主要功能：
 * * GET /internal/tools/schema 包含 search.query
 * * POST /internal/tools/execute 可执行 search.query
 *
 * 依赖：
 * * node:test
 * * app 构建函数
 *
 * 注意事项：
 * * 通过 app.inject 执行，不依赖外部网络
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMainServer } from "./app";
import { hasDatabaseUrl } from "./tests/persistence-test.utils";
import { createPublishedKnowledge } from "./tests/knowledge-test.utils";

/**
 * 验证工具 schema 与执行
 */
test("internal tools routes should expose and execute search/meta/memory/records/plans tools", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const userId = `u-tools-${Date.now()}`;
  const recordSpace = `general-${Date.now()}`;
  const planType = `routine-${Date.now()}`;
  const tenantId = `tenant-${Date.now()}`;
  const { app } = buildMainServer();
  try {
    const schemaRes = await app.inject({
      method: "GET",
      url: "/internal/tools/schema",
    });
    assert.equal(schemaRes.statusCode, 200);
    const schemaBody = schemaRes.json() as {
      tools: Array<{ name: string }>;
    };
    const required = [
      "search.query",
      "user.meta.write",
      "user.meta.query",
      "memory.write",
      "memory.search",
      "memory.summarize",
      "records.write",
      "records.query",
      "records.update",
      "plans.write",
      "plans.query",
      "plans.activate",
      "plans.pause",
      "plans.expand",
    ];
    for (const name of required) {
      assert.ok(schemaBody.tools.some((item) => item.name === name));
    }

    await createPublishedKnowledge(
      app,
      "hello knowledge for search tool",
      tenantId,
    );

    const executeRes = await app.inject({
      method: "POST",
      url: "/internal/tools/execute",
      payload: {
        name: "search.query",
        args: {
          space: "knowledge",
          query: "hello",
          filters: { tenant_id: tenantId },
          topK: 5,
          mode: "hybrid",
          debug: true,
        },
      },
    });
    assert.equal(executeRes.statusCode, 200);
    const executeBody = executeRes.json() as {
      ok: boolean;
      result?: { items?: unknown[]; debug?: { keywordHits?: number; vectorHits?: number } };
    };
    assert.equal(executeBody.ok, true);
    assert.ok((executeBody.result?.items?.length ?? 0) >= 1);
    assert.ok((executeBody.result?.debug?.keywordHits ?? 0) >= 1);
    assert.ok((executeBody.result?.debug?.vectorHits ?? 0) >= 1);

    const metaWriteRes = await app.inject({
      method: "POST",
      url: "/internal/tools/execute",
      payload: {
        name: "user.meta.write",
        args: {
          userId,
          items: [{ key: "wakeup_time", value: "07:30", tags: ["habit"] }],
        },
      },
    });
    assert.equal(metaWriteRes.statusCode, 200);
    assert.equal((metaWriteRes.json() as { ok: boolean }).ok, true);

    await app.inject({
      method: "POST",
      url: "/internal/tools/execute",
      payload: {
        name: "memory.write",
        args: {
          userId,
          content: "I prefer morning exercise",
          tags: ["habit"],
        },
      },
    });
    const memorySearchRes = await app.inject({
      method: "POST",
      url: "/internal/tools/execute",
      payload: {
        name: "memory.search",
        args: {
          userId,
          query: "morning",
          topK: 5,
        },
      },
    });
    assert.equal(memorySearchRes.statusCode, 200);
    const memorySearchBody = memorySearchRes.json() as {
      ok: boolean;
      result?: { items?: unknown[] };
    };
    assert.equal(memorySearchBody.ok, true);
    assert.ok((memorySearchBody.result?.items?.length ?? 0) >= 1);

    const recordWriteRes = await app.inject({
      method: "POST",
      url: "/internal/tools/execute",
      payload: {
        name: "records.write",
        args: {
          userId,
          space: recordSpace,
          type: "note",
          payload: { mood: "good" },
        },
      },
    });
    assert.equal(recordWriteRes.statusCode, 200);
    assert.equal((recordWriteRes.json() as { ok: boolean }).ok, true);

    const planWriteRes = await app.inject({
      method: "POST",
      url: "/internal/tools/execute",
      payload: {
        name: "plans.write",
        args: {
          userId,
          space: recordSpace,
          type: planType,
          payload: { title: "morning plan" },
        },
      },
    });
    assert.equal(planWriteRes.statusCode, 200);
    const planWriteBody = planWriteRes.json() as {
      ok: boolean;
      result?: { planId?: string };
    };
    assert.equal(planWriteBody.ok, true);

    const planId = (planWriteBody.result as { planId?: string } | undefined)?.planId;
    assert.ok(planId);
    const planExpandRes = await app.inject({
      method: "POST",
      url: "/internal/tools/execute",
      payload: {
        name: "plans.expand",
        args: {
          planId,
          date: "2026-04-13",
        },
      },
    });
    assert.equal(planExpandRes.statusCode, 200);
    const planExpandBody = planExpandRes.json() as {
      ok: boolean;
      result?: { items?: unknown[] };
    };
    assert.equal(planExpandBody.ok, true);
    assert.ok((planExpandBody.result?.items?.length ?? 0) >= 1);
  } finally {
    await app.close();
  }
});
