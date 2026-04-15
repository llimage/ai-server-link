/**
 * Agent Runtime 到 Main Server 模型联通测试
 *
 * 所属模块：
 * * agent-runtime/tests
 *
 * 文件作用：
 * * 验证 model-client 仅通过 internal API 与 main-server 联通
 *
 * 主要功能：
 * * invoke 联通
 * * streamInvoke 联通
 *
 * 依赖：
 * * node:test
 * * main-server buildMainServer
 * * RuntimeModelClient
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { RuntimeModelClient } from "../model-client/model-client";

test("runtime model client should invoke and stream invoke through internal API", async () => {
  const app = Fastify();
  app.get("/internal/models/catalog", async () => ({
    code: 0,
    message: "ok",
    data: {
      items: [{ modelId: "mock-general", family: "mock" }],
    },
  }));
  app.post("/internal/model/invoke", async () => ({
    code: 0,
    message: "ok",
    data: {
      modelId: "mock-general",
      events: [{ type: "delta", text: "hello invoke" }, { type: "done" }],
      attempts: [{ modelId: "mock-general", attempt: 1, success: true }],
    },
  }));
  app.post("/internal/model/invoke/stream", async () => ({
    code: 0,
    message: "ok",
    data: {
      modelId: "mock-general",
      events: [{ type: "delta", text: "hello stream" }, { type: "done" }],
      attempts: [{ modelId: "mock-general", attempt: 1, success: true }],
    },
  }));

  await app.listen({ port: 0, host: "127.0.0.1" });
  const address = app.server.address();
  if (!address || typeof address === "string") {
    await app.close();
    throw new Error("server address unavailable");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const client = new RuntimeModelClient(baseUrl);

  try {
    const invokeResponse = await client.invoke({
      runId: "run_agent_model_client_1",
      sessionId: "sess_agent_model_client_1",
      userId: "user_agent_model_client_1",
      modelId: "mock-general",
      messages: [{ role: "user", content: "hello invoke" }],
    });
    assert.equal(invokeResponse.ok, true);
    assert.ok(invokeResponse.events.some((event) => event.type === "delta"));

    const streamResponse = await client.streamInvoke({
      runId: "run_agent_model_client_2",
      sessionId: "sess_agent_model_client_2",
      userId: "user_agent_model_client_2",
      modelId: "mock-general",
      messages: [{ role: "user", content: "hello stream" }],
      stream: true,
    });
    assert.equal(streamResponse.ok, true);
    assert.ok(streamResponse.events.some((event) => event.type === "delta"));
  } finally {
    await app.close();
  }
});
