/**
 * Memory 内部路由测试
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 验证 user-meta 与 memory internal routes 最小闭环
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMainServer } from "./app";
import { hasDatabaseUrl } from "./tests/persistence-test.utils";

test("memory internal routes should support write/query/search/summarize", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const userId = `u-route-${Date.now()}`;
  const { app } = buildMainServer();
  try {
    const metaWrite = await app.inject({
      method: "POST",
      url: "/internal/user-meta/write",
      payload: {
        userId,
        items: [{ key: "wakeup_time", value: "07:30", tags: ["habit"] }],
      },
    });
    assert.equal(metaWrite.statusCode, 200);

    const metaQuery = await app.inject({
      method: "POST",
      url: "/internal/user-meta/query",
      payload: { userId, keys: ["wakeup_time"] },
    });
    assert.equal(metaQuery.statusCode, 200);
    assert.ok((metaQuery.json() as { items: unknown[] }).items.length >= 1);

    const memoryWrite = await app.inject({
      method: "POST",
      url: "/internal/memory/write",
      payload: {
        userId,
        content: "I prefer morning exercise",
      },
    });
    assert.equal(memoryWrite.statusCode, 200);

    const memorySearch = await app.inject({
      method: "POST",
      url: "/internal/memory/search",
      payload: { userId, query: "morning", topK: 5 },
    });
    assert.equal(memorySearch.statusCode, 200);
    assert.ok(
      ((memorySearch.json() as { items: unknown[] }).items?.length ?? 0) >= 1,
    );

    const summarize = await app.inject({
      method: "POST",
      url: "/internal/memory/summarize",
      payload: { userId, limit: 5 },
    });
    assert.equal(summarize.statusCode, 200);
    assert.ok(
      typeof (summarize.json() as { summary: string }).summary === "string",
    );
  } finally {
    await app.close();
  }
});
