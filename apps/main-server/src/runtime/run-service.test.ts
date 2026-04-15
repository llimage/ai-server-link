/**
 * Runtime Core RunService 基础测试
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 验证 run 创建、单 active run 约束与取消后的会话释放
 *
 * 主要功能：
 * * createRun active-run 限制
 * * cancelRun 清理 session.activeRunId
 *
 * 依赖：
 * * node:test
 * * runtime-core in-memory stores
 * * run-service
 *
 * 注意事项：
 * * 仅覆盖本批最小生命周期规则
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryRunStore, InMemorySessionStore, type Session } from "runtime-core";
import { ERROR_CODES } from "protocol";
import { RunService } from "./run-service";

/**
 * 获取当前时间
 *
 * 功能说明：
 * * 生成测试数据所需时间戳
 *
 * @returns ISO 时间字符串
 */
function now(): string {
  return new Date().toISOString();
}

/**
 * 测试单会话单 active run 规则
 *
 * 功能说明：
 * * 在已有未终态 run 时，第二次 createRun 应抛 ACTIVE_RUN_EXISTS
 */
test("createRun should enforce single active run per session", async () => {
  const sessionStore = new InMemorySessionStore();
  const runStore = new InMemoryRunStore();
  const runService = new RunService(runStore, sessionStore);

  const session: Session = {
    sessionId: "sess_1",
    userId: "u1",
    status: "active",
    createdAt: now(),
    updatedAt: now(),
  };
  await sessionStore.set(session);

  await runService.createRun("sess_1", "u1", { type: "text", text: "hello" });
  await assert.rejects(
    async () => {
      await runService.createRun("sess_1", "u1", { type: "text", text: "again" });
    },
    (error: unknown) => {
      return (
        error instanceof Error &&
        "code" in error &&
        (error as { code: string }).code === ERROR_CODES.ACTIVE_RUN_EXISTS
      );
    },
  );
});

/**
 * 测试取消释放 activeRun
 *
 * 功能说明：
 * * cancelRun 后会话 activeRunId 必须被清空
 */
test("cancelRun should clear session.activeRunId", async () => {
  const sessionStore = new InMemorySessionStore();
  const runStore = new InMemoryRunStore();
  const runService = new RunService(runStore, sessionStore);

  const session: Session = {
    sessionId: "sess_2",
    userId: "u2",
    status: "active",
    createdAt: now(),
    updatedAt: now(),
  };
  await sessionStore.set(session);

  const run = await runService.createRun("sess_2", "u2", {
    type: "text",
    text: "cancel me",
  });
  await runService.cancelRun(run.runId, "manual");
  const nextSession = await sessionStore.get("sess_2");
  assert.equal(nextSession?.activeRunId, undefined);
});

