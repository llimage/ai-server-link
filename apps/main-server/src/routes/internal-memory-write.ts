/**
 * Memory 写入内部路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供 /internal/memory/write 路由
 */

import type { FastifyInstance } from "fastify";
import type { MemoryWriteRequest } from "protocol";
import type { MemoryGateway } from "../gateways/memory-gateway";

export function registerInternalMemoryWriteRoute(
  app: FastifyInstance,
  gateway: MemoryGateway,
): void {
  app.post<{ Body: MemoryWriteRequest }>(
    "/internal/memory/write",
    async (request, reply) => {
      const body = request.body;
      if (!body?.userId || typeof body.content !== "string") {
        return reply.code(400).send({ message: "Invalid memory.write payload" });
      }
      return gateway.writeMemory(body);
    },
  );
}

