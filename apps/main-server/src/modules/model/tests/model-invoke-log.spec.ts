/**
 * Model Invoke 日志持久化测试
 *
 * 所属模块：
 * * main-server/modules/model/tests
 *
 * 文件作用：
 * * 验证 ModelInvokeLogService 对 model_invoke_logs 的创建、成功回写、失败回写
 *
 * 主要功能：
 * * onStart -> onSuccess
 * * onStart -> onFailure
 *
 * 依赖：
 * * ModelInvokeLogService
 * * ModelInvokeLogRepository
 * * PrismaService
 *
 * 注意事项：
 * * 仅在配置 DATABASE_URL 时执行真实数据库测试
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ModelInvokeLogRepository } from "../../../repositories/model-invoke-log.repository";
import { ModelInvokeLogService } from "../services/model-invoke-log.service";
import { hasDatabaseUrl, withPrisma } from "../../../tests/persistence-test.utils";

/**
 * 验证 model invoke 成功日志落库
 *
 * 功能说明：
 * * 创建 invoke 日志后回写 usage、attempts、latency 等字段
 *
 * @returns Promise<void>
 */
test("model-invoke-log persistence: success path should be written", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }

  await withPrisma(async (prisma) => {
    const repository = new ModelInvokeLogRepository(prisma);
    const service = new ModelInvokeLogService(repository);
    const runId = `run_model_${Date.now()}`;

    await prisma.run.create({
      data: {
        id: runId,
        sessionId: "session_model",
        status: "running",
        timeoutMs: 30000,
      },
    });

    const context = await service.onStart({
      runId,
      modelId: "mock-general",
      provider: "mock-provider",
    });
    await service.onSuccess(context.logId, context.startedAt, {
      usage: { promptTokens: 12, completionTokens: 30, totalTokens: 42 },
      finishReason: "completed",
      attempts: [{ modelId: "mock-general", status: "success", attempt: 1 }],
    });

    const row = await repository.getByRequestId(context.requestId);
    assert.ok(row);
    assert.equal(row?.success, true);
    assert.equal(row?.modelId, "mock-general");
    assert.equal(row?.finishReason, "completed");
  });
});

/**
 * 验证 model invoke 失败日志落库
 *
 * 功能说明：
 * * 创建 invoke 日志后回写失败状态和错误消息
 *
 * @returns Promise<void>
 */
test("model-invoke-log persistence: failure path should be written", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }

  await withPrisma(async (prisma) => {
    const repository = new ModelInvokeLogRepository(prisma);
    const service = new ModelInvokeLogService(repository);
    const context = await service.onStart({
      modelId: "mock-general",
      provider: "mock-provider",
    });
    await service.onFailure(context.logId, new Error("invoke failed"));

    const row = await repository.getByRequestId(context.requestId);
    assert.ok(row);
    assert.equal(row?.success, false);
    assert.equal(row?.errorMessage, "invoke failed");
  });
});

