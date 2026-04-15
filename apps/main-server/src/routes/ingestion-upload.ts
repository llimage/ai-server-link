/**
 * Ingestion 上传路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供摄入上传入口
 *
 * 主要功能：
 * * POST /api/admin/ingestion/upload
 *
 * 依赖：
 * * fastify
 * * protocol
 * * ingestion-gateway
 *
 * 注意事项：
 * * 当前只做最小 JSON 上传校验
 */

import type { FastifyInstance } from "fastify";
import type { IngestionUploadRequest } from "protocol";
import type { IngestionGateway } from "../gateways/ingestion-gateway";

/**
 * 注册上传路由
 *
 * @param app Fastify 实例
 * @param gateway 摄入网关
 */
export function registerIngestionUploadRoute(
  app: FastifyInstance,
  gateway: IngestionGateway,
): void {
  app.post<{ Body: IngestionUploadRequest }>(
    "/api/admin/ingestion/upload",
    async (request, reply) => {
      const body = request.body;
      if (!body?.rawText && !body?.fileUri) {
        return reply
          .code(400)
          .send({ message: "rawText or fileUri is required" });
      }
      return gateway.upload(body);
    },
  );
}

