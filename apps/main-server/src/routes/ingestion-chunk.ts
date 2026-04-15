/**
 * Ingestion 切块路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供 chunk 阶段执行入口
 *
 * 主要功能：
 * * POST /api/admin/ingestion/chunk
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
 * 注册 chunk 路由
 */
export function registerIngestionChunkRoute(
  app: FastifyInstance,
  gateway: IngestionGateway,
): void {
  app.post<{ Body: IngestionStageRequest }>(
    "/api/admin/ingestion/chunk",
    async (request, reply) => {
      const body = request.body;
      if (!body?.sourceId || !body?.taskId) {
        return reply.code(400).send({ message: "sourceId and taskId are required" });
      }
      return gateway.chunk(body);
    },
  );
}

