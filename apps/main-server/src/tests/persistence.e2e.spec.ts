/**
 * 持久化端到端测试
 *
 * 所属模块：
 * * main-server/tests
 *
 * 文件作用：
 * * 模拟最小主链路写入，验证关键数据会真实落库并可查询
 *
 * 主要功能：
 * * run + run_events
 * * tool_call_logs
 * * model_invoke_logs
 * * records / plans / user_meta / memory
 *
 * 依赖：
 * * 各 Repository 与持久化 Service
 * * PrismaService
 *
 * 注意事项：
 * * 仅在配置 DATABASE_URL 时执行真实数据库测试
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { RecordsRepository } from "../repositories/records.repository";
import { PlansRepository } from "../repositories/plans.repository";
import { UserMetaRepository } from "../repositories/user-meta.repository";
import { MemoryRepository } from "../repositories/memory.repository";
import { RunRepository } from "../repositories/run.repository";
import { RunEventRepository } from "../repositories/run-event.repository";
import { ToolCallLogRepository } from "../repositories/tool-call-log.repository";
import { ModelInvokeLogRepository } from "../repositories/model-invoke-log.repository";
import { PersistentRecordsService } from "../modules/records/services/records.service";
import { PersistentPlansService } from "../modules/plans/services/plans.service";
import { PersistentUserMetaService } from "../modules/user-meta/services/user-meta.service";
import { PersistentMemoryService } from "../modules/memory/services/memory.service";
import { RunLogService } from "../modules/runtime/services/run-log.service";
import { ToolCallLogService } from "../modules/runtime/services/tool-call-log.service";
import { ModelInvokeLogService } from "../modules/model/services/model-invoke-log.service";
import { hasDatabaseUrl, withPrisma } from "./persistence-test.utils";

/**
 * 验证持久化最小闭环
 *
 * 功能说明：
 * * 模拟 user input -> run -> tool -> model 的日志链路
 * * 同时写入 records/plans/meta/memory 并断言可查询
 *
 * @returns Promise<void>
 */
test("persistence e2e: should write and query all core persistence tables", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }

  await withPrisma(async (prisma) => {
    const runRepository = new RunRepository(prisma);
    const runEventRepository = new RunEventRepository(prisma);
    const toolCallLogRepository = new ToolCallLogRepository(prisma);
    const modelInvokeLogRepository = new ModelInvokeLogRepository(prisma);
    const recordsRepository = new RecordsRepository(prisma);
    const plansRepository = new PlansRepository(prisma);
    const userMetaRepository = new UserMetaRepository(prisma);
    const memoryRepository = new MemoryRepository(prisma);

    const runLogService = new RunLogService(runRepository, runEventRepository);
    const toolCallLogService = new ToolCallLogService(toolCallLogRepository);
    const modelInvokeLogService = new ModelInvokeLogService(modelInvokeLogRepository);
    const recordsService = new PersistentRecordsService(recordsRepository);
    const plansService = new PersistentPlansService(plansRepository);
    const userMetaService = new PersistentUserMetaService(userMetaRepository);
    const memoryService = new PersistentMemoryService(memoryRepository);

    const runId = `run_e2e_${Date.now()}`;
    const userId = `user_e2e_${Date.now()}`;

    await runLogService.onRunCreated(runId, {
      sessionId: "session_e2e",
      userId,
      inputText: "hello e2e",
      timeoutMs: 30000,
    });
    await runLogService.onRunStarted(runId, { stage: "started" });
    await runLogService.onRunStreaming(runId, { chunk: "delta" });

    const toolStart = await toolCallLogService.onStart({
      runId,
      sessionId: "session_e2e",
      toolName: "memory.search",
      args: { query: "hello" },
    });
    await toolCallLogService.onSuccess(toolStart.logId, toolStart.startedAt, {
      items: [],
    });

    const modelStart = await modelInvokeLogService.onStart({
      runId,
      modelId: "mock-general",
      provider: "mock-provider",
    });
    await modelInvokeLogService.onSuccess(modelStart.logId, modelStart.startedAt, {
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      finishReason: "completed",
      attempts: [{ modelId: "mock-general", attempt: 1, status: "success" }],
    });
    await runLogService.onRunCompleted(runId, { finishReason: "completed" });

    const record = await recordsService.write({
      userId,
      space: "general",
      type: "note",
      payload: { mood: "good" },
    });
    const plan = await plansService.write({
      userId,
      space: "general",
      type: "routine",
      payload: { title: "morning routine" },
    });
    await plansService.activate({ planId: plan.planId });
    await userMetaService.write({
      userId,
      items: [{ key: "wakeup_time", value: "07:30", tags: ["habit"] }],
    });
    await memoryService.write({
      userId,
      content: "I prefer morning exercise",
      tags: ["habit"],
    });
    await memoryService.summarize({
      userId,
      limit: 10,
    });

    const run = await runRepository.getRunById(runId);
    const runEvents = await runEventRepository.listEventsByRunId(runId);
    const toolLogs = await toolCallLogRepository.listByRunId(runId);
    const modelLog = await modelInvokeLogRepository.getByRequestId(modelStart.requestId);
    const records = await recordsService.query({ userId, limit: 10 });
    const plans = await plansService.query({ userId, limit: 10 });
    const metas = await userMetaService.query({ userId, keys: ["wakeup_time"] });
    const memories = await memoryService.search({ userId, query: "morning", topK: 10 });
    const summaries = await memoryRepository.listSummariesByUserId(userId);

    assert.ok(run);
    assert.equal(run?.status, "completed");
    assert.ok(runEvents.length >= 4);
    assert.ok(toolLogs.length >= 1);
    assert.equal(toolLogs[0]?.status, "completed");
    assert.ok(modelLog);
    assert.equal(modelLog?.success, true);
    assert.ok(records.items.some((item) => item.recordId === record.recordId));
    assert.ok(plans.items.some((item) => item.planId === plan.planId));
    assert.ok(metas.items.length >= 1);
    assert.ok(memories.items.length >= 1);
    assert.ok(summaries.length >= 1);
  });
});

