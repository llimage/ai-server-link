/**
 * Ingestion 向量化路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供 embed 阶段执行入口
 *
 * 主要功能：
 * * POST /api/admin/ingestion/embed
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
 * 注册 embed 路由
 */
export function registerIngestionEmbedRoute(
  app: FastifyInstance,
  gateway: IngestionGateway,
): void {
  app.post<{ Body: IngestionStageRequest }>(
    "/api/admin/ingestion/embed",
    async (request, reply) => {
      const body = request.body;
      if (!body?.sourceId || !body?.taskId) {
        return reply.code(400).send({ message: "sourceId and taskId are required" });
      }
      return gateway.embed(body);
    },
  );
}

