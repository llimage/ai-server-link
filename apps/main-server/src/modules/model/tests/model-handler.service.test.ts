/**
 * Model Handler 模块服务测试
 *
 * 所属模块：
 * * main-server/modules/model/tests
 *
 * 文件作用：
 * * 验证 model handler service 的 invoke/stream 调用路径
 *
 * 主要功能：
 * * invoke 成功
 * * stream invoke 成功
 *
 * 依赖：
 * * node:test
 * * model-core
 * * model-gateway
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DefaultFallbackPolicy,
  DefaultRetryPolicy,
  InMemoryModelCatalog,
  ModelInvokeService,
  ModelRouter,
  MockProviderAdapter,
} from "model-core";
import { ModelGateway } from "../../../gateways/model-gateway";
import { ModelHandlerService } from "../services/model-handler.service";

/**
 * 创建待测服务
 *
 * @returns model handler service
 */
function createService(): ModelHandlerService {
  const catalog = new InMemoryModelCatalog();
  const invokeService = new ModelInvokeService({
    catalog,
    router: new ModelRouter(catalog),
    providerAdapter: new MockProviderAdapter(),
    retryPolicy: new DefaultRetryPolicy(),
    fallbackPolicy: new DefaultFallbackPolicy(),
  });
  return new ModelHandlerService(new ModelGateway(catalog, invokeService));
}

test("model handler service invoke should return response data", async () => {
  const service = createService();
  const response = await service.invoke({
    runId: "run_mod_service_1",
    sessionId: "sess_mod_service_1",
    userId: "user_mod_service_1",
    modelId: "mock-general",
    messages: [{ role: "user", content: "hello" }],
  });
  assert.equal(response.modelId, "mock-general");
  assert.ok(response.events.some((event) => event.type === "delta"));
  assert.ok(response.events.some((event) => event.type === "done"));
});

test("model handler service streamInvoke should return response data", async () => {
  const service = createService();
  const response = await service.streamInvoke({
    runId: "run_mod_service_2",
    sessionId: "sess_mod_service_2",
    userId: "user_mod_service_2",
    modelId: "mock-general",
    messages: [{ role: "user", content: "hello stream" }],
    stream: true,
  });
  assert.equal(response.modelId, "mock-general");
  assert.ok(response.events.some((event) => event.type === "delta"));
  assert.ok(response.events.some((event) => event.type === "done"));
});

