/**
 * records.update 内部路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供 /internal/records/update 接口
 * * 将请求转发到 records-plans-gateway
 */

import type { FastifyInstance } from "fastify";
import type { RecordsUpdateRequest } from "protocol";
import type { RecordsPlansGateway } from "../gateways/records-plans-gateway";

/**
 * 注册 records.update 路由
 *
 * @param app Fastify 实例
 * @param gateway records/plans 网关
 */
export function registerInternalRecordsUpdateRoute(
  app: FastifyInstance,
  gateway: RecordsPlansGateway,
): void {
  app.post<{ Body: RecordsUpdateRequest }>(
    "/internal/records/update",
    async (request, reply) => {
      const body = request.body;
      if (!body?.recordId) {
        return reply.code(400).send({ message: "Invalid records.update payload" });
      }
      return gateway.updateRecord(body);
    },
  );
}

