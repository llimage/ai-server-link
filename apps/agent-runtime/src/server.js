"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAgentRuntimeServer = buildAgentRuntimeServer;
const fastify_1 = __importDefault(require("fastify"));
const agent_loop_1 = require("./agent-loop");
const cancel_registry_1 = require("./cancel-registry");
const event_emitter_1 = require("./event-emitter");
const tool_client_1 = require("./tool-client");
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
function buildAgentRuntimeServer(options = {}) {
    const app = (0, fastify_1.default)({ logger: true });
    const mainServerBaseUrl = options.mainServerBaseUrl ??
        process.env.MAIN_SERVER_INTERNAL_BASE_URL ??
        "http://127.0.0.1:4000";
    const agentRuntimeId = options.agentRuntimeId ?? "agent-runtime-1";
    const cancelRegistry = new cancel_registry_1.CancelRegistry();
    const eventEmitter = new event_emitter_1.EventEmitter(mainServerBaseUrl);
    const toolClient = new tool_client_1.ToolClient(mainServerBaseUrl);
    const agentLoop = new agent_loop_1.AgentLoop(eventEmitter, cancelRegistry, toolClient);
    app.get("/internal/agent/health", async () => ({
        ok: true,
        agentRuntimeId,
        status: "healthy",
    }));
    app.post("/internal/agent/run", async (request) => {
        const body = request.body;
        if (!body || !body.runId || !body.sessionId || !body.userId) {
            return {
                accepted: false,
                runId: body?.runId ?? "unknown",
                agentRuntimeId,
                message: "invalid payload",
            };
        }
        void agentLoop.run(body).catch((error) => {
            app.log.error({ error, runId: body.runId }, "agent loop execution failed");
        });
        return {
            accepted: true,
            runId: body.runId,
            agentRuntimeId,
        };
    });
    app.post("/internal/agent/cancel", async (request) => {
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
async function start() {
    const port = Number(process.env.PORT ?? 4100);
    const host = process.env.HOST ?? "0.0.0.0";
    const app = buildAgentRuntimeServer();
    await app.listen({ port, host });
}
if (require.main === module) {
    void start();
}
