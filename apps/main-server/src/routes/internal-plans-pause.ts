/**
 * plans.pause 内部路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 提供 /internal/plans/pause 接口
 * * 将请求转发到 records-plans-gateway
 */

import type { FastifyInstance } from "fastify";
import type { PlansPauseRequest } from "protocol";
import type { RecordsPlansGateway } from "../gateways/records-plans-gateway";

/**
 * 注册 plans.pause 路由
 *
 * @param app Fastify 实例
 * @param gateway records/plans 网关
 */
export function registerInternalPlansPauseRoute(
  app: FastifyInstance,
  gateway: RecordsPlansGateway,
): void {
  app.post<{ Body: PlansPauseRequest }>("/internal/plans/pause", async (request, reply) => {
    const body = request.body;
    if (!body?.planId) {
      return reply.code(400).send({ message: "Invalid plans.pause payload" });
    }
    return gateway.pausePlan(body);
  });
}

