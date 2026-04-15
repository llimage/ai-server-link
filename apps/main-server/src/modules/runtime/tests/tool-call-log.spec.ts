/**
 * Tool 调用日志持久化测试
 *
 * 所属模块：
 * * main-server/modules/runtime/tests
 *
 * 文件作用：
 * * 验证 ToolCallLogService 对 tool_call_logs 的创建、成功回写、失败回写
 *
 * 主要功能：
 * * onStart -> onSuccess
 * * onStart -> onFailure
 *
 * 依赖：
 * * ToolCallLogService
 * * ToolCallLogRepository
 * * PrismaService
 *
 * 注意事项：
 * * 仅在配置 DATABASE_URL 时执行真实数据库测试
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ToolCallLogRepository } from "../../../repositories/tool-call-log.repository";
import { ToolCallLogService } from "../services/tool-call-log.service";
import { hasDatabaseUrl, withPrisma } from "../../../tests/persistence-test.utils";

/**
 * 验证 tool 调用成功日志落库
 *
 * 功能说明：
 * * 先创建 started 日志，再回写 completed 和摘要
 *
 * @returns Promise<void>
 */
test("tool-call-log persistence: success path should be written", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }

  await withPrisma(async (prisma) => {
    const repository = new ToolCallLogRepository(prisma);
    const service = new ToolCallLogService(repository);
    const runId = `run_tool_${Date.now()}`;

    await prisma.run.create({
      data: {
        id: runId,
        sessionId: "session_tool",
        status: "running",
        timeoutMs: 30000,
      },
    });

    const context = await service.onStart({
      runId,
      sessionId: "session_tool",
      toolName: "memory.search",
      args: { query: "morning" },
    });
    await service.onSuccess(context.logId, context.startedAt, {
      items: [{ id: "m1" }],
    });

    const rows = await repository.listByRunId(runId);
    assert.ok(rows.length >= 1);
    assert.equal(rows[0]?.status, "completed");
    assert.equal(typeof rows[0]?.resultSummary, "string");
  });
});

/**
 * 验证 tool 调用失败日志落库
 *
 * 功能说明：
 * * 先创建 started 日志，再回写 failed 与错误信息
 *
 * @returns Promise<void>
 */
test("tool-call-log persistence: failure path should be written", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }

  await withPrisma(async (prisma) => {
    const repository = new ToolCallLogRepository(prisma);
    const service = new ToolCallLogService(repository);
    const runId = `run_tool_fail_${Date.now()}`;

    await prisma.run.create({
      data: {
        id: runId,
        sessionId: "session_tool_fail",
        status: "running",
        timeoutMs: 30000,
      },
    });

    const context = await service.onStart({
      runId,
      sessionId: "session_tool_fail",
      toolName: "records.write",
      args: { payload: {} },
    });
    await service.onFailure(context.logId, context.startedAt, new Error("tool failed"));

    const rows = await repository.listByRunId(runId);
    assert.ok(rows.length >= 1);
    assert.equal(rows[0]?.status, "failed");
    assert.equal(rows[0]?.errorMessage, "tool failed");
  });
});

