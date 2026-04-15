/**
 * 模型调用内部路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 暴露模型目录与模型调用内部接口
 *
 * 主要功能：
 * * GET /internal/models/catalog
 * * POST /internal/model/invoke
 *
 * 依赖：
 * * model-gateway
 * * protocol model 协议
 */

import type { FastifyInstance } from "fastify";
import type { ModelGateway } from "../gateways/model-gateway";
import { InternalModelController } from "../modules/model/controllers/internal-model.controller";
import { ModelHandlerService } from "../modules/model/services/model-handler.service";
import type { ModelInvokeLogService } from "../modules/model/services/model-invoke-log.service";

/**
 * 注册模型内部路由
 *
 * @param app Fastify 实例
 * @param gateway 模型网关
 */
export function registerInternalModelRoutes(
  app: FastifyInstance,
  gateway: ModelGateway,
  modelInvokeLogService?: ModelInvokeLogService,
): void {
  const service = new ModelHandlerService(gateway, modelInvokeLogService);
  const controller = new InternalModelController(service);

  app.get("/internal/models/catalog", async () => controller.handleCatalog());
  app.post("/internal/model/invoke", async (request, reply) =>
    controller.handleInvoke(request, reply),
  );
  app.post("/internal/model/invoke/stream", async (request, reply) =>
    controller.handleStreamInvoke(request, reply),
  );
}
