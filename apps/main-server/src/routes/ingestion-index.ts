/**
 * Ingestion 建索引路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供 index 阶段执行入口
 *
 * 主要功能：
 * * POST /api/admin/ingestion/index
 *
 * 依赖：
 * * fastify
 * * protocol
 * * ingestion-gateway
 */

import type { FastifyInstance } from "fastify";
import type { IngestionStageRequest } from "protocol";
import type { IngestionGateway } from "../gateways/ingestion-gateway";

/**
 * 注册 index 路由
 */
export function registerIngestionIndexRoute(
  app: FastifyInstance,
  gateway: IngestionGateway,
): void {
  app.post<{ Body: IngestionStageRequest }>(
    "/api/admin/ingestion/index",
    async (request, reply) => {
      const body = request.body;
      if (!body?.sourceId || !body?.taskId) {
        return reply.code(400).send({ message: "sourceId and taskId are required" });
      }
      return gateway.index(body);
    },
  );
}

