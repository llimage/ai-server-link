/**
 * plans.expand 内部路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供 /internal/plans/expand 接口
 * * 将请求转发到 records-plans-gateway
 */

import type { FastifyInstance } from "fastify";
import type { PlansExpandRequest } from "protocol";
import type { RecordsPlansGateway } from "../gateways/records-plans-gateway";

/**
 * 注册 plans.expand 路由
 *
 * @param app Fastify 实例
 * @param gateway records/plans 网关
 */
export function registerInternalPlansExpandRoute(
  app: FastifyInstance,
  gateway: RecordsPlansGateway,
): void {
  app.post<{ Body: PlansExpandRequest }>("/internal/plans/expand", async (request, reply) => {
    const body = request.body;
    if (!body?.planId) {
      return reply.code(400).send({ message: "Invalid plans.expand payload" });
    }
    return gateway.expandPlan(body);
  });
}

