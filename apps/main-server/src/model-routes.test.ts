/**
 * Model 内部路由测试
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 验证模型目录查询与模型调用内部接口可用
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMainServer } from "./app";
import { hasDatabaseUrl, withPrisma } from "./tests/persistence-test.utils";

test("model routes should expose catalog and invoke", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const runId = `run_model_route_${Date.now()}`;
  const sessionId = `session_model_route_${Date.now()}`;
  const userId = `user_model_route_${Date.now()}`;
  const { app } = buildMainServer();
  try {
    await withPrisma(async (prisma) => {
      await prisma.run.create({
        data: {
          id: runId,
          sessionId,
          userId,
          status: "running",
          timeoutMs: 5000,
        },
      });
    });
    const catalogRes = await app.inject({
      method: "GET",
      url: "/internal/models/catalog",
    });
    assert.equal(catalogRes.statusCode, 200);
    const catalogBody = catalogRes.json() as {
      code: number;
      data: {
        items: Array<{ modelId: string }>;
      };
    };
    assert.equal(catalogBody.code, 0);
    assert.ok(
      catalogBody.data.items.some((item) => item.modelId === "mock-general"),
    );

    const invokeRes = await app.inject({
      method: "POST",
      url: "/internal/model/invoke",
      payload: {
        runId,
        sessionId,
        userId,
        modelId: "mock-general",
        messages: [{ role: "user", content: "hello" }],
        stream: true,
        timeoutMs: 5000,
      },
    });
    assert.equal(invokeRes.statusCode, 200);
    const invokeBody = invokeRes.json() as {
      code: number;
      data: {
        modelId: string;
        events?: Array<{ type: string }>;
        attempts?: Array<{ modelId: string }>;
      };
    };
    assert.equal(invokeBody.code, 0);
    assert.equal(invokeBody.data.modelId, "mock-general");
    assert.ok((invokeBody.data.events?.length ?? 0) >= 2);
    assert.ok((invokeBody.data.attempts?.length ?? 0) >= 1);

    const streamRes = await app.inject({
      method: "POST",
      url: "/internal/model/invoke/stream",
      payload: {
        runId,
        sessionId,
        userId,
        modelId: "mock-general",
        messages: [{ role: "user", content: "hello stream" }],
        stream: true,
        timeoutMs: 5000,
      },
    });
    assert.equal(streamRes.statusCode, 200);
    const streamBody = streamRes.json() as {
      code: number;
      data: { events: Array<{ type: string }> };
    };
    assert.equal(streamBody.code, 0);
    assert.ok(streamBody.data.events.some((event) => event.type === "delta"));
    assert.ok(streamBody.data.events.some((event) => event.type === "done"));
  } finally {
    await app.close();
  }
});
