/**
 * Run 生命周期日志持久化测试
 *
 * 所属模块：
 * * main-server/modules/runtime/tests
 *
 * 文件作用：
 * * 验证 RunLogService 会将 run 创建与状态事件写入 runs/run_events
 *
 * 主要功能：
 * * run created/started/streaming/completed 的落库断言
 *
 * 依赖：
 * * RunLogService
 * * RunRepository
 * * RunEventRepository
 * * PrismaService
 *
 * 注意事项：
 * * 仅在配置 DATABASE_URL 时执行真实数据库测试
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { RunEventRepository } from "../../../repositories/run-event.repository";
import { RunRepository } from "../../../repositories/run.repository";
import { RunLogService } from "../services/run-log.service";
import { hasDatabaseUrl, withPrisma } from "../../../tests/persistence-test.utils";

/**
 * 验证 run 生命周期日志落库
 *
 * 功能说明：
 * * 依次触发 created/started/streaming/completed
 * * 校验 runs 状态和 run_events 事件数量
 *
 * @returns Promise<void>
 */
test("run-log persistence: lifecycle should be written to database", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }

  await withPrisma(async (prisma) => {
    const runRepository = new RunRepository(prisma);
    const runEventRepository = new RunEventRepository(prisma);
    const service = new RunLogService(runRepository, runEventRepository);
    const runId = `run_persist_${Date.now()}`;

    await service.onRunCreated(runId, {
      sessionId: "session_persist_run",
      userId: "user_persist_run",
      inputText: "hello persistence",
      timeoutMs: 30000,
    });
    await service.onRunStarted(runId, { stage: "started" });
    await service.onRunStreaming(runId, { chunk: "delta-1" });
    await service.onRunCompleted(runId, { output: "done" });

    const run = await runRepository.getRunById(runId);
    assert.ok(run);
    assert.equal(run?.status, "completed");

    const events = await runEventRepository.listEventsByRunId(runId);
    assert.ok(events.length >= 4);
    assert.equal(events[0]?.eventType, "created");
  });
});

