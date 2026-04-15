/**
 * User Meta 查询内部路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供 /internal/user-meta/query 路由
 */

import type { FastifyInstance } from "fastify";
import type { UserMetaQueryRequest } from "protocol";
import type { MemoryGateway } from "../gateways/memory-gateway";

export function registerInternalUserMetaQueryRoute(
  app: FastifyInstance,
  gateway: MemoryGateway,
): void {
  app.post<{ Body: UserMetaQueryRequest }>(
    "/internal/user-meta/query",
    async (request, reply) => {
      const body = request.body;
      if (!body?.userId) {
        return reply.code(400).send({ message: "Invalid user.meta.query payload" });
      }
      return gateway.queryUserMeta(body);
    },
  );
}

