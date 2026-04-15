/**
 * Search Core 内部查询路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 暴露 POST /internal/search/query 供内部调试与运营调用
 *
 * 主要功能：
 * * 校验请求
 * * 调用 SearchGateway.query
 * * 返回标准响应
 *
 * 依赖：
 * * fastify
 * * protocol SearchQueryRequest
 * * search-gateway
 *
 * 注意事项：
 * * 本路由用于内部调用，agent 主链路仍优先走 tool 系统
 */

import type { FastifyInstance } from "fastify";
import type { SearchQueryRequest } from "protocol";
import type { SearchGateway } from "../gateways/search-gateway";

/**
 * 注册内部搜索路由
 *
 * 功能说明：
 * * 将 /internal/search/query 注册到主服务
 *
 * @param app Fastify 实例
 * @param searchGateway 搜索网关
 * @returns void
 */
export function registerInternalSearchQueryRoute(
  app: FastifyInstance,
  searchGateway: SearchGateway,
): void {
  app.post<{ Body: SearchQueryRequest }>("/internal/search/query", async (request, reply) => {
    const body = request.body;
    if (!body || !body.space || !body.query) {
      return reply
        .code(400)
        .send({ message: "Invalid search payload: space and query are required" });
    }
    return searchGateway.query(body);
  });
}
