/**
 * Model Core 测试
 *
 * 所属模块：
 * * model-core
 *
 * 文件作用：
 * * 验证 catalog/router/invoke/retry/fallback 的最小闭环能力
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import type { ModelInvokeRequest } from "protocol";
import { InMemoryModelCatalog } from "./model-catalog";
import { DefaultFallbackPolicy } from "./fallback-policy";
import { MODEL_ERROR_CODES, ModelCoreError } from "./model-errors";
import { ModelInvokeService } from "./model-invoke";
import { ModelRouter } from "./model-router";
import { MockProviderAdapter } from "./providers/mock-provider";
import { DefaultRetryPolicy } from "./retry-policy";

function createService(): ModelInvokeService {
  const catalog = new InMemoryModelCatalog();
  return new ModelInvokeService({
    catalog,
    router: new ModelRouter(catalog),
    providerAdapter: new MockProviderAdapter(),
    retryPolicy: new DefaultRetryPolicy(),
    fallbackPolicy: new DefaultFallbackPolicy(),
  });
}

function createRequest(
  text: string,
  modelId = "mock-general",
): ModelInvokeRequest {
  return {
    runId: "run_model",
    sessionId: "session_model",
    userId: "user_model",
    modelId,
    messages: [{ role: "user", content: text }],
    stream: true,
    timeoutMs: 5000,
  };
}

test("catalog should list and get public models", async () => {
  const catalog = new InMemoryModelCatalog();
  const listed = await catalog.list();
  assert.ok(listed.some((item) => item.modelId === "mock-general"));
  assert.ok(listed.some((item) => item.modelId === "mock-fast"));
  assert.ok(listed.some((item) => item.modelId === "mock-tools"));

  const found = await catalog.get("mock-general");
  assert.equal(found?.family, "mock");
});

test("router should resolve model and reject unknown model", async () => {
  const catalog = new InMemoryModelCatalog();
  const router = new ModelRouter(catalog);
  const resolved = await router.resolve("mock-general");
  assert.equal(resolved.primary.modelId, "mock-general");
  assert.ok(resolved.fallbacks.length >= 1);

  await assert.rejects(async () => router.resolve("unknown.model"), (error) => {
    assert.ok(error instanceof ModelCoreError);
    assert.equal((error as ModelCoreError).code, MODEL_ERROR_CODES.MODEL_NOT_FOUND);
    return true;
  });
});

test("invoke should return delta and done events", async () => {
  const service = createService();
  const response = await service.invoke(createRequest("hello"));
  const hasDelta = response.events.some((event) => event.type === "delta");
  const hasDone = response.events.some((event) => event.type === "done");
  assert.equal(response.ok, true);
  assert.equal(response.modelId, "mock-general");
  assert.equal(hasDelta, true);
  assert.equal(hasDone, true);
  assert.ok(response.attempts.length >= 1);
});

test("force_fail should trigger fallback from mock-general to mock-fast", async () => {
  const service = createService();
  const response = await service.invoke(createRequest("force_fail"));
  const deltaEvents = response.events.filter((event) => event.type === "delta");
  assert.ok(deltaEvents.length >= 1);
  assert.ok(
    deltaEvents.some((event) =>
      event.type === "delta" ? event.text.includes("mock-fast") : false,
    ),
  );
  assert.ok(
    response.attempts.some(
      (attempt) => attempt.modelId === "mock-general" && attempt.success === false,
    ),
  );
  assert.ok(
    response.attempts.some(
      (attempt) => attempt.modelId === "mock-fast" && attempt.success === true,
    ),
  );
});

test("invoke should reject unknown model", async () => {
  const service = createService();
  await assert.rejects(
    async () => service.invoke(createRequest("hello", "unknown.model")),
    (error) => {
      assert.ok(error instanceof ModelCoreError);
      assert.equal((error as ModelCoreError).code, MODEL_ERROR_CODES.MODEL_NOT_FOUND);
      return true;
    },
  );
});

test("streamInvoke should return stream events", async () => {
  const service = createService();
  const response = await service.streamInvoke(createRequest("hello"));
  assert.equal(response.ok, true);
  assert.ok(response.events.some((event) => event.type === "delta"));
  assert.ok(response.events.some((event) => event.type === "done"));
});
