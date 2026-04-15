/**
 * User Meta 写入内部路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供 /internal/user-meta/write 路由
 */

import type { FastifyInstance } from "fastify";
import type { UserMetaWriteRequest } from "protocol";
import type { MemoryGateway } from "../gateways/memory-gateway";

export function registerInternalUserMetaWriteRoute(
  app: FastifyInstance,
  gateway: MemoryGateway,
): void {
  app.post<{ Body: UserMetaWriteRequest }>(
    "/internal/user-meta/write",
    async (request, reply) => {
      const body = request.body;
      if (!body?.userId || !Array.isArray(body.items)) {
        return reply.code(400).send({ message: "Invalid user.meta.write payload" });
      }
      return gateway.writeUserMeta(body);
    },
  );
}

