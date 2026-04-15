/**
 * Memory 搜索内部路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供 /internal/memory/search 路由
 */

import type { FastifyInstance } from "fastify";
import type { MemorySearchRequest } from "protocol";
import type { MemoryGateway } from "../gateways/memory-gateway";

export function registerInternalMemorySearchRoute(
  app: FastifyInstance,
  gateway: MemoryGateway,
): void {
  app.post<{ Body: MemorySearchRequest }>(
    "/internal/memory/search",
    async (request, reply) => {
      const body = request.body;
      if (!body?.userId || !body?.query) {
        return reply.code(400).send({ message: "Invalid memory.search payload" });
      }
      return gateway.searchMemory(body);
    },
  );
}

