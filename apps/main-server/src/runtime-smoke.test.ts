/**
 * Runtime Core 主链路烟雾测试
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 验证 main-server 与 agent-runtime 的最小联调闭环
 *
 * 主要功能：
 * * WebSocket 建连获取 session.ready
 * * 发送 message.create 触发 run
 * * 验证 run.started、message.delta、run.completed
 *
 * 依赖：
 * * node:test
 * * ws
 * * 主服务构建函数
 * * agent-runtime 构建函数
 *
 * 注意事项：
 * * 该测试仅验证 Runtime Core 主链路，不覆盖 tool/search/memory
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import WebSocket from "ws";
import type { ClientMessageCreateEvent, ServerWsEvent } from "protocol";
import { buildMainServer } from "./app";
import { buildAgentRuntimeServer } from "../../agent-runtime/src/server";
import { hasDatabaseUrl } from "./tests/persistence-test.utils";

/**
 * Runtime Core 闭环测试
 *
 * 功能说明：
 * * 验证 ws -> run -> runtime event -> ws 的最小可用链路
 */
test("runtime core smoke: ws -> run -> deltas -> completed", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const agentApp = Fastify({ logger: false });
  const main = buildMainServer({
    defaultAgentRuntimeUrl: "http://127.0.0.1:4201",
  });

  let mainAddress = "";
  let socket: WebSocket | null = null;

  try {
    agentApp.post("/internal/agent/run", async (request) => {
      const body = request.body as {
        runId: string;
        sessionId: string;
      };
      setTimeout(() => {
        void fetch("http://127.0.0.1:4200/internal/runtime/events", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            runId: body.runId,
            sessionId: body.sessionId,
            events: [
            {
              type: "tool_call",
              toolName: "search.query",
              toolCallId: `tool_${body.runId}`,
              args: {
                space: "knowledge",
                query: "hello",
                filters: { tenant_id: "demo" },
                topK: 5,
                mode: "hybrid",
              },
              ts: new Date().toISOString(),
            },
            {
              type: "delta",
              text: "search returned 3 results",
              ts: new Date().toISOString(),
            },
            {
              type: "done",
              outputText: "search returned 3 results",
              ts: new Date().toISOString(),
            },
          ],
          }),
        });
      }, 200);
      return { accepted: true, runId: body.runId, agentRuntimeId: "runtime-test" };
    });
    agentApp.post("/internal/agent/cancel", async () => ({ accepted: true }));
    agentApp.get("/internal/agent/health", async () => ({ ok: true }));

    mainAddress = await main.app.listen({ host: "127.0.0.1", port: 4200 });
    await agentApp.listen({ host: "127.0.0.1", port: 4201 });
    assert.ok(mainAddress.includes("4200"));

    const events: ServerWsEvent[] = [];
    socket = new WebSocket("ws://127.0.0.1:4200/ws", {
      headers: {
        "x-user-id": "user-smoke",
      },
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(
            `timeout waiting for runtime flow, received events: ${JSON.stringify(events)}`,
          ),
        );
      }, 8000);

      socket?.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      socket?.on("message", (raw) => {
        const parsed = JSON.parse(
          typeof raw === "string" ? raw : raw.toString("utf8"),
        ) as ServerWsEvent;
        events.push(parsed);

        if (parsed.event === "session.ready") {
          const payload: ClientMessageCreateEvent = {
            event: "message.create",
            sessionId: parsed.sessionId,
            messageId: "msg_001",
            input: {
              type: "text",
              text: "please search hello",
            },
            options: {
              stream: true,
              timeoutMs: 30000,
              agentId: "general.default",
            },
          };
          socket?.send(JSON.stringify(payload));
        }

        const deltaCount = events.filter((item) => item.event === "message.delta").length;
        const hasToolCall = events.some((item) => item.event === "run.tool_call");
        const hasStarted = events.some((item) => item.event === "run.started");
        const hasCompleted = events.some((item) => item.event === "run.completed");
        if (hasStarted && hasToolCall && deltaCount >= 1 && hasCompleted) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  } finally {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    await agentApp.close();
    await main.app.close();
  }
});

/**
 * 等待并驱动一次 WS 运行流程
 *
 * 功能说明：
 * * 连接 main-server 的 ws 入口
 * * 在收到 session.ready 后发送 message.create
 * * 收集并返回所有服务端事件
 *
 * @param inputText 用户输入文本
 * @returns 当前运行流程收到的事件列表
 *
 * @throws Error 当在超时时间内未收到 run.completed 时抛出
 */
async function runWsFlow(inputText: string): Promise<ServerWsEvent[]> {
  const events: ServerWsEvent[] = [];
  const socket = new WebSocket("ws://127.0.0.1:4200/ws", {
    headers: {
      "x-user-id": "user-smoke",
    },
  });

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(
            `timeout waiting for runtime flow, received events: ${JSON.stringify(events)}`,
          ),
        );
      }, 8000);

      socket.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      socket.on("message", (raw) => {
        const parsed = JSON.parse(
          typeof raw === "string" ? raw : raw.toString("utf8"),
        ) as ServerWsEvent;
        events.push(parsed);

        if (parsed.event === "session.ready") {
          const payload: ClientMessageCreateEvent = {
            event: "message.create",
            sessionId: parsed.sessionId,
            messageId: "msg_001",
            input: {
              type: "text",
              text: inputText,
            },
            options: {
              stream: true,
              timeoutMs: 30000,
              agentId: "general.default",
            },
          };
          socket.send(JSON.stringify(payload));
        }

        if (parsed.event === "run.completed") {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  } finally {
    if (socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  }

  return events;
}

/**
 * metadata 路径 WS 烟测
 *
 * 功能说明：
 * * 启动真实 main-server 与 agent-runtime
 * * 发送 remember key 输入，验证 user.meta.write/user.meta.query 工具调用与完成事件
 */
test("runtime smoke: ws metadata flow should call user.meta tools and complete", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const main = buildMainServer({
    defaultAgentRuntimeUrl: "http://127.0.0.1:4201",
  });
  const agent = buildAgentRuntimeServer({
    mainServerBaseUrl: "http://127.0.0.1:4200",
  });

  try {
    await main.app.listen({ host: "127.0.0.1", port: 4200 });
    await agent.listen({ host: "127.0.0.1", port: 4201 });

  const events = await runWsFlow("please remember key wakeup_time=07:30");
  const hasStarted = events.some((item) => item.event === "run.started");
  const hasCompleted = events.some((item) => item.event === "run.completed");
  const toolCalls = events
    .filter((item) => item.event === "run.tool_call")
    .map((item) => item.toolName);

  assert.equal(hasStarted, true);
  assert.equal(hasCompleted, true);
  assert.ok(toolCalls.includes("user.meta.write"));
  assert.ok(toolCalls.includes("user.meta.query"));
  } finally {
    await agent.close();
    await main.app.close();
  }
});

/**
 * memory 路径 WS 烟测
 *
 * 功能说明：
 * * 启动真实 main-server 与 agent-runtime
 * * 发送 remember text 输入，验证 memory.write/memory.search 工具调用与完成事件
 */
test("runtime smoke: ws memory flow should call memory tools and complete", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const main = buildMainServer({
    defaultAgentRuntimeUrl: "http://127.0.0.1:4201",
  });
  const agent = buildAgentRuntimeServer({
    mainServerBaseUrl: "http://127.0.0.1:4200",
  });

  try {
    await main.app.listen({ host: "127.0.0.1", port: 4200 });
    await agent.listen({ host: "127.0.0.1", port: 4201 });

    const events = await runWsFlow("please remember text I prefer morning exercise");
    const hasStarted = events.some((item) => item.event === "run.started");
    const hasCompleted = events.some((item) => item.event === "run.completed");
    const toolCalls = events
      .filter((item) => item.event === "run.tool_call")
      .map((item) => item.toolName);

    assert.equal(hasStarted, true);
    assert.equal(hasCompleted, true);
    assert.deepEqual(toolCalls, ["memory.write", "memory.search"]);
  } finally {
    await agent.close();
    await main.app.close();
  }
});

/**
 * records 路径 WS 烟测
 *
 * 功能说明：
 * * 启动真实 main-server 与 agent-runtime
 * * 发送 record 输入，验证 records.write/records.query 工具调用与完成事件
 */
test("runtime smoke: ws records flow should call records tools and complete", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const main = buildMainServer({
    defaultAgentRuntimeUrl: "http://127.0.0.1:4201",
  });
  const agent = buildAgentRuntimeServer({
    mainServerBaseUrl: "http://127.0.0.1:4200",
  });

  try {
    await main.app.listen({ host: "127.0.0.1", port: 4200 });
    await agent.listen({ host: "127.0.0.1", port: 4201 });

    const events = await runWsFlow("please record mood=good");
    const hasStarted = events.some((item) => item.event === "run.started");
    const hasCompleted = events.some((item) => item.event === "run.completed");
    const toolCalls = events
      .filter((item) => item.event === "run.tool_call")
      .map((item) => item.toolName);

    assert.equal(hasStarted, true);
    assert.equal(hasCompleted, true);
    assert.deepEqual(toolCalls, ["records.write", "records.query"]);
  } finally {
    await agent.close();
    await main.app.close();
  }
});

/**
 * plans 路径 WS 烟测
 *
 * 功能说明：
 * * 启动真实 main-server 与 agent-runtime
 * * 发送 plan 输入，验证 plans.write/activate/query/expand 工具调用与完成事件
 */
test("runtime smoke: ws plans flow should call plans tools and complete", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const main = buildMainServer({
    defaultAgentRuntimeUrl: "http://127.0.0.1:4201",
  });
  const agent = buildAgentRuntimeServer({
    mainServerBaseUrl: "http://127.0.0.1:4200",
  });

  try {
    await main.app.listen({ host: "127.0.0.1", port: 4200 });
    await agent.listen({ host: "127.0.0.1", port: 4201 });

    const events = await runWsFlow("please create a plan for tomorrow morning");
    const hasStarted = events.some((item) => item.event === "run.started");
    const hasCompleted = events.some((item) => item.event === "run.completed");
    const toolCalls = events
      .filter((item) => item.event === "run.tool_call")
      .map((item) => item.toolName);

    assert.equal(hasStarted, true);
    assert.equal(hasCompleted, true);
    assert.deepEqual(toolCalls, [
      "plans.write",
      "plans.activate",
      "plans.query",
      "plans.expand",
    ]);
  } finally {
    await agent.close();
    await main.app.close();
  }
});

/**
 * 普通对话 WS 烟测（走 model handler）
 *
 * 功能说明：
 * * 启动真实 main-server 与 agent-runtime
 * * 发送普通文本，验证收到 delta 与 completed
 */
test("runtime smoke: ws default chat should invoke model handler and complete", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const main = buildMainServer({
    defaultAgentRuntimeUrl: "http://127.0.0.1:4201",
  });
  const agent = buildAgentRuntimeServer({
    mainServerBaseUrl: "http://127.0.0.1:4200",
  });

  try {
    await main.app.listen({ host: "127.0.0.1", port: 4200 });
    await agent.listen({ host: "127.0.0.1", port: 4201 });

    const events = await runWsFlow("hello plain message");
    const hasStarted = events.some((item) => item.event === "run.started");
    const hasCompleted = events.some((item) => item.event === "run.completed");
    const deltaCount = events.filter((item) => item.event === "message.delta").length;

    assert.equal(hasStarted, true);
    assert.equal(hasCompleted, true);
    assert.ok(deltaCount >= 1);
  } finally {
    await agent.close();
    await main.app.close();
  }
});
