/**
 * Memory 摘要内部路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供 /internal/memory/summarize 路由
 */

import type { FastifyInstance } from "fastify";
import type { MemorySummarizeRequest } from "protocol";
import type { MemoryGateway } from "../gateways/memory-gateway";

export function registerInternalMemorySummarizeRoute(
  app: FastifyInstance,
  gateway: MemoryGateway,
): void {
  app.post<{ Body: MemorySummarizeRequest }>(
    "/internal/memory/summarize",
    async (request, reply) => {
      const body = request.body;
      if (!body?.userId) {
        return reply.code(400).send({ message: "Invalid memory.summarize payload" });
      }
      return gateway.summarizeMemory(body);
    },
  );
}

