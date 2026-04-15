/**
 * Agent Runtime 执行循环测试
 *
 * 所属模块：
 * * agent-runtime
 *
 * 文件作用：
 * * 验证 remember key / remember text 两条演示路径的事件闭环
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  AgentRuntimeEvent,
  InternalAgentRunRequest,
  ModelInvokeRequest,
  ModelInvokeResponse,
} from "protocol";
import { AgentLoop } from "./agent-loop";
import { CancelRegistry } from "./cancel-registry";
import type { EventEmitter } from "./event-emitter";
import type { ModelClient } from "./model-client";
import type { ToolClient } from "./tool-client";

class FakeEventEmitter {
  public readonly events: AgentRuntimeEvent[] = [];

  async emit(
    runId: string,
    sessionId: string,
    event: AgentRuntimeEvent,
  ): Promise<void> {
    void runId;
    void sessionId;
    this.events.push(event);
  }
}

class FakeToolClient {
  async executeTool(payload: { toolName: string; args: unknown }): Promise<unknown> {
    if (payload.toolName === "user.meta.write") {
      return { ok: true, written: 1 };
    }
    if (payload.toolName === "user.meta.query") {
      return { items: [{ key: "wakeup_time", value: "07:30" }] };
    }
    if (payload.toolName === "memory.write") {
      return { ok: true, memoryId: "mem_1" };
    }
    if (payload.toolName === "memory.search") {
      return { items: [{ id: "mem_1", content: "I prefer morning exercise" }] };
    }
    if (payload.toolName === "records.write") {
      return { ok: true, recordId: "rec_1" };
    }
    if (payload.toolName === "records.query") {
      return { items: [{ recordId: "rec_1", payload: { mood: "good" } }] };
    }
    if (payload.toolName === "plans.write") {
      return { ok: true, planId: "plan_1" };
    }
    if (payload.toolName === "plans.activate") {
      return { ok: true, planId: "plan_1" };
    }
    if (payload.toolName === "plans.query") {
      return { items: [{ planId: "plan_1", status: "active" }] };
    }
    if (payload.toolName === "plans.expand") {
      return { planId: "plan_1", items: [{ scheduledAt: "2026-04-13T09:00:00.000Z" }] };
    }
    return { ok: true };
  }
}

class FakeModelClient {
  async invokeModel(_: ModelInvokeRequest): Promise<ModelInvokeResponse> {
    return {
      ok: true,
      modelId: "mock-general",
      events: [
        { type: "delta", text: "model chunk #1. " },
        { type: "delta", text: "model chunk #2." },
        { type: "done" },
      ],
      attempts: [{ modelId: "mock-general", attempt: 1, success: true }],
    };
  }

  async streamInvokeModel(_: ModelInvokeRequest): Promise<ModelInvokeResponse> {
    return this.invokeModel(_);
  }
}

function createRequest(text: string): InternalAgentRunRequest {
  return {
    runId: "run_test",
    sessionId: "sess_test",
    userId: "user_test",
    agentId: "general.default",
    timeoutMs: 30000,
    stream: true,
    input: {
      type: "text",
      text,
    },
  };
}

test("AgentLoop should run metadata demo flow", async () => {
  const emitter = new FakeEventEmitter();
  const loop = new AgentLoop(
    emitter as unknown as EventEmitter,
    new CancelRegistry(),
    new FakeToolClient() as unknown as ToolClient,
    new FakeModelClient() as unknown as ModelClient,
  );
  await loop.run(createRequest("please remember key wakeup_time=07:30"));

  const toolCalls = emitter.events.filter((e) => e.type === "tool_call");
  assert.equal(toolCalls.length, 2);
  const names = toolCalls.map((e) => (e.type === "tool_call" ? e.toolName : ""));
  assert.deepEqual(names, ["user.meta.write", "user.meta.query"]);
  assert.ok(emitter.events.some((e) => e.type === "done"));
});

test("AgentLoop should run memory demo flow", async () => {
  const emitter = new FakeEventEmitter();
  const loop = new AgentLoop(
    emitter as unknown as EventEmitter,
    new CancelRegistry(),
    new FakeToolClient() as unknown as ToolClient,
    new FakeModelClient() as unknown as ModelClient,
  );
  await loop.run(createRequest("please remember text I prefer morning exercise"));

  const toolCalls = emitter.events.filter((e) => e.type === "tool_call");
  assert.equal(toolCalls.length, 2);
  const names = toolCalls.map((e) => (e.type === "tool_call" ? e.toolName : ""));
  assert.deepEqual(names, ["memory.write", "memory.search"]);
  assert.ok(emitter.events.some((e) => e.type === "done"));
});

test("AgentLoop should run records demo flow", async () => {
  const emitter = new FakeEventEmitter();
  const loop = new AgentLoop(
    emitter as unknown as EventEmitter,
    new CancelRegistry(),
    new FakeToolClient() as unknown as ToolClient,
    new FakeModelClient() as unknown as ModelClient,
  );
  await loop.run(createRequest("please record mood=good"));

  const toolCalls = emitter.events.filter((e) => e.type === "tool_call");
  assert.equal(toolCalls.length, 2);
  const names = toolCalls.map((e) => (e.type === "tool_call" ? e.toolName : ""));
  assert.deepEqual(names, ["records.write", "records.query"]);
  assert.ok(emitter.events.some((e) => e.type === "done"));
});

test("AgentLoop should run plans demo flow", async () => {
  const emitter = new FakeEventEmitter();
  const loop = new AgentLoop(
    emitter as unknown as EventEmitter,
    new CancelRegistry(),
    new FakeToolClient() as unknown as ToolClient,
    new FakeModelClient() as unknown as ModelClient,
  );
  await loop.run(createRequest("please create a plan for tomorrow morning"));

  const toolCalls = emitter.events.filter((e) => e.type === "tool_call");
  assert.equal(toolCalls.length, 4);
  const names = toolCalls.map((e) => (e.type === "tool_call" ? e.toolName : ""));
  assert.deepEqual(names, [
    "plans.write",
    "plans.activate",
    "plans.query",
    "plans.expand",
  ]);
  assert.ok(emitter.events.some((e) => e.type === "done"));
});

test("AgentLoop should use model client for default flow", async () => {
  const emitter = new FakeEventEmitter();
  const loop = new AgentLoop(
    emitter as unknown as EventEmitter,
    new CancelRegistry(),
    new FakeToolClient() as unknown as ToolClient,
    new FakeModelClient() as unknown as ModelClient,
  );
  await loop.run(createRequest("hello normal chat"));

  const deltas = emitter.events.filter((e) => e.type === "delta");
  assert.equal(deltas.length, 2);
  assert.ok(emitter.events.some((e) => e.type === "done"));
});
