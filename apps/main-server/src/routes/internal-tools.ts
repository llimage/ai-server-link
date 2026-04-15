/**
 * Tool Core 内部工具路由
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 暴露工具 schema 查询与执行接口，支撑内部联调验收
 *
 * 主要功能：
 * * GET /internal/tools/schema
 * * POST /internal/tools/execute
 *
 * 依赖：
 * * fastify
 * * tool-core ToolDefinition
 *
 * 注意事项：
 * * 当前仅提供最小工具执行能力，不做复杂权限与配额控制
 */

import type { FastifyInstance } from "fastify";
import type { ToolDefinition } from "tool-core";
import type { ToolCallLogService } from "../modules/runtime/services/tool-call-log.service";

/**
 * 工具执行请求体
 */
interface InternalToolExecuteBody {
  name: string;
  args: unknown;
}

/**
 * 注册内部工具路由
 *
 * 功能说明：
 * * 注册 schema 查询与工具执行接口
 *
 * @param app Fastify 实例
 * @param tools 工具定义列表
 * @returns void
 */
export function registerInternalToolRoutes(
  app: FastifyInstance,
  tools: ToolDefinition[],
  toolCallLogService?: ToolCallLogService,
): void {
  app.get("/internal/tools/schema", async () => {
    return {
      tools: tools.map((tool) => ({
        name: tool.name,
        visibility: tool.visibility,
        sideEffect: tool.sideEffect,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
      })),
    };
  });

  app.post<{ Body: InternalToolExecuteBody }>(
    "/internal/tools/execute",
    async (request, reply) => {
      const body = request.body;
      if (!body?.name) {
        return reply.code(400).send({ ok: false, error: "Tool name is required" });
      }
      const tool = tools.find((item) => item.name === body.name);
      if (!tool) {
        return reply.code(404).send({ ok: false, error: "Tool not found" });
      }
      const logContext = await toolCallLogService?.onStart({
        toolName: tool.name,
        args: body.args,
      });
      try {
        const result = await tool.execute(body.args);
        if (logContext) {
          await toolCallLogService?.onSuccess(
            logContext.logId,
            logContext.startedAt,
            result,
          );
        }
        return { ok: true, result };
      } catch (error) {
        if (logContext) {
          await toolCallLogService?.onFailure(
            logContext.logId,
            logContext.startedAt,
            error,
          );
        }
        throw error;
      }
    },
  );
}
