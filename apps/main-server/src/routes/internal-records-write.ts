/**
 * records.write 内部路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供 /internal/records/write 接口
 * * 将请求转发到 records-plans-gateway
 */

import type { FastifyInstance } from "fastify";
import type { RecordsWriteRequest } from "protocol";
import type { RecordsPlansGateway } from "../gateways/records-plans-gateway";

/**
 * 注册 records.write 路由
 *
 * @param app Fastify 实例
 * @param gateway records/plans 网关
 */
export function registerInternalRecordsWriteRoute(
  app: FastifyInstance,
  gateway: RecordsPlansGateway,
): void {
  app.post<{ Body: RecordsWriteRequest }>(
    "/internal/records/write",
    async (request, reply) => {
      const body = request.body;
      if (!body?.userId || !body?.space || !body?.type || !body?.payload) {
        return reply.code(400).send({ message: "Invalid records.write payload" });
      }
      return gateway.writeRecord(body);
    },
  );
}

