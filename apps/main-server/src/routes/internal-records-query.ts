/**
 * records.query 内部路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供 /internal/records/query 接口
 * * 将请求转发到 records-plans-gateway
 */

import type { FastifyInstance } from "fastify";
import type { RecordsQueryRequest } from "protocol";
import type { RecordsPlansGateway } from "../gateways/records-plans-gateway";

/**
 * 注册 records.query 路由
 *
 * @param app Fastify 实例
 * @param gateway records/plans 网关
 */
export function registerInternalRecordsQueryRoute(
  app: FastifyInstance,
  gateway: RecordsPlansGateway,
): void {
  app.post<{ Body: RecordsQueryRequest }>(
    "/internal/records/query",
    async (request, reply) => {
      const body = request.body;
      if (!body?.userId) {
        return reply.code(400).send({ message: "Invalid records.query payload" });
      }
      return gateway.queryRecords(body);
    },
  );
}

