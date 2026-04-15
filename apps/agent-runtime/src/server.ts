/**
 * Runtime Core Agent Runtime 服务入口
 *
 * 所属模块：
 * * agent-runtime
 *
 * 文件作用：
 * * 启动 agent-runtime HTTP 服务并暴露内部运行接口
 *
 * 主要功能：
 * * POST /internal/agent/run
 * * POST /internal/agent/cancel
 * * GET /internal/agent/health
 *
 * 依赖：
 * * fastify
 * * protocol
 * * agent-loop
 * * event-emitter
 * * cancel-registry
 *
 * 注意事项：
 * * run 接口必须异步受理，不阻塞请求线程等待完整执行
 */

import Fastify, { type FastifyInstance } from "fastify";
import type {
  InternalAgentCancelRequest,
  InternalAgentRunRequest,
  InternalAgentRunResponse,
} from "protocol";
import { AgentLoop } from "./agent-loop";
import { CancelRegistry } from "./cancel-registry";
import { EventEmitter } from "./event-emitter";
import { ModelClient } from "./model-client";
import { ToolClient } from "./tool-client";

/**
 * Agent Runtime 构建选项
 */
export interface AgentRuntimeOptions {
  mainServerBaseUrl?: string;
  agentRuntimeId?: string;
}

/**
 * 构建 agent-runtime 服务
 *
 * 功能说明：
 * * 装配 loop、event emitter 和取消注册表
 * * 注册内部接口
 *
 * @param options 启动选项
 * @returns Fastify 实例
 */
export function buildAgentRuntimeServer(
  options: AgentRuntimeOptions = {},
): FastifyInstance {
  const app = Fastify({ logger: true });
  const mainServerBaseUrl =
    options.mainServerBaseUrl ??
    process.env.MAIN_SERVER_INTERNAL_BASE_URL ??
    "http://127.0.0.1:4000";
  const agentRuntimeId = options.agentRuntimeId ?? "agent-runtime-1";

  const cancelRegistry = new CancelRegistry();
  const eventEmitter = new EventEmitter(mainServerBaseUrl);
  const toolClient = new ToolClient(mainServerBaseUrl);
  const modelClient = new ModelClient(mainServerBaseUrl);
  const agentLoop = new AgentLoop(
    eventEmitter,
    cancelRegistry,
    toolClient,
    modelClient,
  );

  app.get("/internal/agent/health", async () => ({
    ok: true,
    agentRuntimeId,
    status: "healthy",
  }));

  app.post<{
    Body: InternalAgentRunRequest;
  }>("/internal/agent/run", async (request) => {
    const body = request.body;
    if (!body || !body.runId || !body.sessionId || !body.userId) {
      return {
        accepted: false,
        runId: body?.runId ?? "unknown",
        agentRuntimeId,
        message: "invalid payload",
      } satisfies InternalAgentRunResponse;
    }

    void agentLoop.run(body).catch((error: unknown) => {
      app.log.error(
        { error, runId: body.runId },
        "agent loop execution failed",
      );
    });

    return {
      accepted: true,
      runId: body.runId,
      agentRuntimeId,
    } satisfies InternalAgentRunResponse;
  });

  app.post<{
    Body: InternalAgentCancelRequest;
  }>("/internal/agent/cancel", async (request) => {
    const body = request.body;
    if (body?.runId) {
      cancelRegistry.markCancelled(body.runId);
    }
    return { accepted: true, runId: body?.runId ?? "unknown" };
  });

  return app;
}

/**
 * 启动 agent-runtime 服务
 *
 * 功能说明：
 * * 从环境变量读取端口并启动服务
 *
 * @returns void
 */
async function start(): Promise<void> {
  const port = Number(process.env.PORT ?? 4100);
  const host = process.env.HOST ?? "0.0.0.0";
  const app = buildAgentRuntimeServer();
  await app.listen({ port, host });
}

if (require.main === module) {
  void start();
}
