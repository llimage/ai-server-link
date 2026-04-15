/**
 * Scheduler Core 基础测试
 *
 * 所属模块：
 * * scheduler-core
 *
 * 文件作用：
 * * 验证队列、调度策略和单会话 active run 限制
 *
 * 主要功能：
 * * 队列入队出队测试
 * * agent 选择策略测试
 * * 单 session active run 限制测试
 *
 * 依赖：
 * * node:test
 * * runtime-core in-memory stores
 * * scheduler-core classes
 *
 * 注意事项：
 * * 测试只验证调度核心逻辑，不依赖网络
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { InMemoryRunStore, InMemorySessionStore, type Run, type Session } from "runtime-core";
import { DefaultDispatchPolicy } from "./dispatch-policy";
import { InMemoryAgentRegistry } from "./agent-registry";
import { InMemoryRunQueue } from "./run-queue";

/**
 * 创建时间字符串
 *
 * 功能说明：
 * * 为测试对象生成统一时间戳
 *
 * @returns ISO 时间字符串
 */
function now(): string {
  return new Date().toISOString();
}

/**
 * 测试 FIFO 队列行为
 *
 * 功能说明：
 * * 验证 enqueue 与 dequeue 顺序
 *
 * @returns void
 */
test("run queue should keep FIFO order", async () => {
  const queue = new InMemoryRunQueue();
  await queue.enqueue("r1");
  await queue.enqueue("r2");
  assert.equal(await queue.dequeue(), "r1");
  assert.equal(await queue.dequeue(), "r2");
  assert.equal(await queue.dequeue(), null);
});

/**
 * 测试 agent 选择策略
 *
 * 功能说明：
 * * 优先 healthy 且 activeRuns 最少实例
 *
 * @returns void
 */
test("dispatch policy should select healthy runtime with least runs", async () => {
  const sessions = new InMemorySessionStore();
  const runs = new InMemoryRunStore();
  const registry = new InMemoryAgentRegistry();
  await registry.register({
    agentRuntimeId: "a1",
    agentId: "general.default",
    status: "healthy",
    activeRuns: 2,
    lastHeartbeatAt: now(),
    baseUrl: "http://a1",
  });
  await registry.register({
    agentRuntimeId: "a2",
    agentId: "general.default",
    status: "healthy",
    activeRuns: 1,
    lastHeartbeatAt: now(),
    baseUrl: "http://a2",
  });
  const policy = new DefaultDispatchPolicy(sessions, runs, registry);
  const picked = await policy.selectAgentRuntime("general.default");
  assert.equal(picked?.agentRuntimeId, "a2");
});

/**
 * 测试单 session active run 限制
 *
 * 功能说明：
 * * session.activeRunId 指向非终态 run 时不可调度
 *
 * @returns void
 */
test("dispatch policy should block session with non-terminal active run", async () => {
  const sessions = new InMemorySessionStore();
  const runs = new InMemoryRunStore();
  const registry = new InMemoryAgentRegistry();
  const session: Session = {
    sessionId: "s1",
    userId: "u1",
    status: "active",
    activeRunId: "r1",
    createdAt: now(),
    updatedAt: now(),
  };
  const run: Run = {
    runId: "r1",
    sessionId: "s1",
    userId: "u1",
    agentId: "general.default",
    status: "running",
    input: { type: "text", text: "hello" },
    timeoutMs: 1000,
    createdAt: now(),
  };
  await sessions.set(session);
  await runs.set(run);
  const policy = new DefaultDispatchPolicy(sessions, runs, registry);
  assert.equal(await policy.canDispatch("s1"), false);
});
