/**
 * Runtime Core 主程序入口
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 组装 main-server 所有核心依赖并启动 HTTP + WebSocket 服务
 * * 暴露内部事件入口供 agent-runtime 回传流式事件
 *
 * 主要功能：
 * * buildMainServer
 * * 注册 /internal/runtime/events
 * * 安装 websocket 服务
 *
 * 依赖：
 * * fastify
 * * protocol
 * * runtime-core
 * * scheduler-core
 * * 本地 ws/runtime/gateways 组件
 *
 * 注意事项：
 * * 本文件只负责装配，不承载业务细节
 */

import "dotenv/config";
import Fastify, { type FastifyInstance } from "fastify";
import type { InternalRuntimeEventsRequest } from "protocol";
import {
  DefaultTextParser,
  IngestionService,
  MockPublisher,
} from "ingestion-core";
import {
  DefaultFallbackPolicy,
  DefaultRetryPolicy,
  InMemoryModelCatalog,
  ModelInvokeService,
  ModelRouter,
  MockProviderAdapter,
} from "model-core";
import { InMemoryRunStore, InMemorySessionStore } from "runtime-core";
import {
  DefaultDispatchPolicy,
  InMemoryAgentRegistry,
  InMemoryRunQueue,
  RunScheduler,
} from "scheduler-core";
import {
  MockRerankAdapter,
  SearchService,
} from "search-core";
import {
  createMemorySearchTool,
  createMemorySummarizeTool,
  createMemoryWriteTool,
  createPlansActivateTool,
  createPlansExpandTool,
  createPlansPauseTool,
  createPlansQueryTool,
  createPlansWriteTool,
  createRecordsQueryTool,
  createRecordsUpdateTool,
  createRecordsWriteTool,
  createSearchQueryTool,
  createUserMetaQueryTool,
  createUserMetaWriteTool,
  type ToolDefinition,
} from "tool-core";
import { AgentGateway } from "./gateways/agent-gateway";
import { IngestionGateway } from "./gateways/ingestion-gateway";
import { MemoryGateway } from "./gateways/memory-gateway";
import { ModelGateway } from "./gateways/model-gateway";
import { RecordsPlansGateway } from "./gateways/records-plans-gateway";
import { SearchGateway } from "./gateways/search-gateway";
import { registerIngestionChunkRoute } from "./routes/ingestion-chunk";
import { registerIngestionEmbedRoute } from "./routes/ingestion-embed";
import { registerIngestionIndexRoute } from "./routes/ingestion-index";
import { registerIngestionParseRoute } from "./routes/ingestion-parse";
import { registerIngestionPublishRoute } from "./routes/ingestion-publish";
import { registerIngestionUploadRoute } from "./routes/ingestion-upload";
import { registerInternalMemorySearchRoute } from "./routes/internal-memory-search";
import { registerInternalMemorySummarizeRoute } from "./routes/internal-memory-summarize";
import { registerInternalMemoryWriteRoute } from "./routes/internal-memory-write";
import { registerInternalModelRoutes } from "./routes/internal-model-invoke";
import { registerInternalPlansActivateRoute } from "./routes/internal-plans-activate";
import { registerInternalPlansExpandRoute } from "./routes/internal-plans-expand";
import { registerInternalPlansPauseRoute } from "./routes/internal-plans-pause";
import { registerInternalPlansQueryRoute } from "./routes/internal-plans-query";
import { registerInternalPlansWriteRoute } from "./routes/internal-plans-write";
import { registerInternalRecordsQueryRoute } from "./routes/internal-records-query";
import { registerInternalRecordsUpdateRoute } from "./routes/internal-records-update";
import { registerInternalRecordsWriteRoute } from "./routes/internal-records-write";
import { registerInternalSearchQueryRoute } from "./routes/internal-search-query";
import { registerInternalToolRoutes } from "./routes/internal-tools";
import { registerInternalUserMetaQueryRoute } from "./routes/internal-user-meta-query";
import { registerInternalUserMetaWriteRoute } from "./routes/internal-user-meta-write";
import { EventRelay } from "./runtime/event-relay";
import { RunService } from "./runtime/run-service";
import { SessionManager } from "./runtime/session-manager";
import { ConnectionManager } from "./ws/connection-manager";
import { WsMessageHandler } from "./ws/ws-message-handler";
import { RuntimeWsServer } from "./ws/server";
import { createPrismaModule } from "./modules/database/prisma.module";
import { RecordsRepository } from "./repositories/records.repository";
import { PlansRepository } from "./repositories/plans.repository";
import { UserMetaRepository } from "./repositories/user-meta.repository";
import { MemoryRepository } from "./repositories/memory.repository";
import { RunRepository } from "./repositories/run.repository";
import { RunEventRepository } from "./repositories/run-event.repository";
import { ToolCallLogRepository } from "./repositories/tool-call-log.repository";
import { ModelInvokeLogRepository } from "./repositories/model-invoke-log.repository";
import { AuditLogRepository } from "./repositories/audit-log.repository";
import { PersistentRecordsService } from "./modules/records/services/records.service";
import { PersistentPlansService } from "./modules/plans/services/plans.service";
import { PersistentUserMetaService } from "./modules/user-meta/services/user-meta.service";
import { PersistentMemoryService } from "./modules/memory/services/memory.service";
import { AuditLogService } from "./modules/audit/services/audit-log.service";
import { RunLogService } from "./modules/runtime/services/run-log.service";
import { ToolCallLogService } from "./modules/runtime/services/tool-call-log.service";
import { ModelInvokeLogService } from "./modules/model/services/model-invoke-log.service";
import { createRedisModule } from "./modules/redis/redis.module";
import { RuntimeCacheService } from "./modules/runtime/services/runtime-cache.service";
import { KnowledgeRepository } from "./repositories/knowledge.repository";
import { IngestionTaskRepository } from "./repositories/ingestion-task.repository";
import { IngestionLogRepository } from "./repositories/ingestion-log.repository";
import { RetrievalLogRepository } from "./repositories/retrieval-log.repository";
import { DatabaseKnowledgeSourceStore } from "./modules/ingestion/services/knowledge-source.store";
import { DatabaseIngestionTaskStore } from "./modules/ingestion/services/ingestion-task.store";
import { DatabaseIngestionLogSink } from "./modules/ingestion/services/ingestion-log.sink";
import { KnowledgeKeywordSearchAdapter } from "./modules/search/services/knowledge-keyword-search.adapter";
import { DatabaseRetrievalLogSink } from "./modules/search/services/retrieval-log.sink";
import { DeterministicEmbedder } from "./modules/ingestion/services/embedding-provider";
import { VectorIndexWriter } from "./modules/ingestion/services/vector-index.writer";
import { LanceDbVectorSearchAdapter } from "./modules/search/services/vector-search.adapter";
import { VectorIndexRepository } from "./repositories/vector-index.repository";
import { LanceDbVectorStore } from "vector-store-core";
import { getVectorStoreConfig } from "./config/vector-store.config";

/**
 * 主服务构建选项
 */
export interface MainServerOptions {
  port?: number;
  host?: string;
  defaultAgentRuntimeUrl?: string;
}

/**
 * 主服务上下文
 */
export interface MainServerContext {
  app: FastifyInstance;
  runScheduler: RunScheduler;
  runService: RunService;
  sessionManager: SessionManager;
  searchGateway: SearchGateway;
  ingestionGateway: IngestionGateway;
  memoryGateway: MemoryGateway;
  tools: ToolDefinition[];
}

/**
 * 构建主服务
 *
 * 功能说明：
 * * 初始化存储、调度、网关、事件转发和 websocket 层
 * * 注册内部事件回传接口
 *
 * @param options 启动选项
 * @returns 主服务上下文
 */
export function buildMainServer(options: MainServerOptions = {}): MainServerContext {
  const app = Fastify({ logger: true });
  const prismaModule = createPrismaModule();
  const redisModule = createRedisModule();
  const runtimeCacheService = new RuntimeCacheService(redisModule.redis);

  const sessionStore = new InMemorySessionStore();
  const runStore = new InMemoryRunStore();
  const runQueue = new InMemoryRunQueue();
  const agentRegistry = new InMemoryAgentRegistry();
  const connectionManager = new ConnectionManager();
  const knowledgeRepository = new KnowledgeRepository(prismaModule.prisma);
  const retrievalLogRepository = new RetrievalLogRepository(prismaModule.prisma);
  const vectorStoreConfig = getVectorStoreConfig();
  const vectorStore = new LanceDbVectorStore(vectorStoreConfig);
  const vectorIndexRepository = new VectorIndexRepository(vectorStore);
  const searchService = new SearchService({
    keywordAdapter: new KnowledgeKeywordSearchAdapter(knowledgeRepository),
    vectorAdapter: new LanceDbVectorSearchAdapter(
      knowledgeRepository,
      vectorIndexRepository,
    ),
    rerankAdapter: new MockRerankAdapter(),
    retrievalLogSink: new DatabaseRetrievalLogSink(retrievalLogRepository),
  });
  const searchGateway = new SearchGateway(searchService);
  const modelCatalog = new InMemoryModelCatalog();
  const modelInvokeService = new ModelInvokeService({
    catalog: modelCatalog,
    router: new ModelRouter(modelCatalog),
    providerAdapter: new MockProviderAdapter(),
    retryPolicy: new DefaultRetryPolicy(),
    fallbackPolicy: new DefaultFallbackPolicy(),
  });
  const modelGateway = new ModelGateway(modelCatalog, modelInvokeService);
  const runRepository = new RunRepository(prismaModule.prisma);
  const runEventRepository = new RunEventRepository(prismaModule.prisma);
  const toolCallLogRepository = new ToolCallLogRepository(prismaModule.prisma);
  const modelInvokeLogRepository = new ModelInvokeLogRepository(prismaModule.prisma);
  const auditLogRepository = new AuditLogRepository(prismaModule.prisma);
  const recordsRepository = new RecordsRepository(prismaModule.prisma);
  const plansRepository = new PlansRepository(prismaModule.prisma);
  const userMetaRepository = new UserMetaRepository(prismaModule.prisma);
  const memoryRepository = new MemoryRepository(prismaModule.prisma);

  const auditLogService = new AuditLogService(auditLogRepository);
  const userMetaService = new PersistentUserMetaService(
    userMetaRepository,
    auditLogService,
  );
  const memoryService = new PersistentMemoryService(
    memoryRepository,
    auditLogService,
  );
  const recordsService = new PersistentRecordsService(
    recordsRepository,
    auditLogService,
  );
  const plansService = new PersistentPlansService(plansRepository, auditLogService);
  const runLogService = new RunLogService(runRepository, runEventRepository);
  const toolCallLogService = new ToolCallLogService(toolCallLogRepository);
  const modelInvokeLogService = new ModelInvokeLogService(modelInvokeLogRepository);
  const memoryGateway = new MemoryGateway(
    userMetaService,
    memoryService,
  );
  const recordsPlansGateway = new RecordsPlansGateway(
    recordsService,
    plansService,
  );
  const tools: ToolDefinition[] = [
    createSearchQueryTool(searchService),
    createUserMetaWriteTool(userMetaService as never),
    createUserMetaQueryTool(userMetaService as never),
    createMemoryWriteTool(memoryService as never),
    createMemorySearchTool(memoryService as never),
    createMemorySummarizeTool(memoryService as never),
    createRecordsWriteTool(recordsService as never),
    createRecordsQueryTool(recordsService as never),
    createRecordsUpdateTool(recordsService as never),
    createPlansWriteTool(plansService as never),
    createPlansQueryTool(plansService as never),
    createPlansActivateTool(plansService as never),
    createPlansPauseTool(plansService as never),
    createPlansExpandTool(plansService as never),
  ];
  const ingestionTaskRepository = new IngestionTaskRepository(prismaModule.prisma);
  const ingestionLogRepository = new IngestionLogRepository(prismaModule.prisma);
  const ingestionTaskStore = new DatabaseIngestionTaskStore(
    ingestionTaskRepository,
    knowledgeRepository,
  );
  const knowledgeSourceStore = new DatabaseKnowledgeSourceStore(knowledgeRepository);
  const ingestionService = new IngestionService({
    taskStore: ingestionTaskStore,
    sourceStore: knowledgeSourceStore,
    logSink: new DatabaseIngestionLogSink(ingestionLogRepository),
    parser: new DefaultTextParser(),
    embedder: new DeterministicEmbedder(),
    indexer: new VectorIndexWriter(knowledgeRepository, vectorIndexRepository),
    publisher: new MockPublisher(knowledgeSourceStore),
  });
  const ingestionGateway = new IngestionGateway(ingestionService);

  const sessionManager = new SessionManager(sessionStore);
  const runService = new RunService(runStore, sessionStore);
  const agentGateway = new AgentGateway();
  const dispatchPolicy = new DefaultDispatchPolicy(
    sessionStore,
    runStore,
    agentRegistry,
  );
  const runScheduler = new RunScheduler(
    runQueue,
    runStore,
    sessionStore,
    dispatchPolicy,
    agentGateway,
  );
  const wsMessageHandler = new WsMessageHandler(
    sessionManager,
    runService,
    runScheduler,
    connectionManager,
    runLogService,
  );
  const relayWithLogs = new EventRelay(
    sessionManager,
    connectionManager,
    runService,
    runLogService,
  );
  const wsServer = new RuntimeWsServer(
    connectionManager,
    sessionManager,
    wsMessageHandler,
  );

  const defaultAgentRuntimeUrl =
    options.defaultAgentRuntimeUrl ??
    process.env.DEFAULT_AGENT_RUNTIME_URL ??
    "http://127.0.0.1:4100";
  const defaultAgentId = process.env.DEFAULT_AGENT_ID ?? "general.default";
  void agentRegistry.register({
    agentRuntimeId: "runtime-default",
    agentId: defaultAgentId,
    status: "healthy",
    activeRuns: 0,
    lastHeartbeatAt: new Date().toISOString(),
    baseUrl: defaultAgentRuntimeUrl,
  });

  app.get("/api/health", async () => ({ ok: true }));
  registerInternalSearchQueryRoute(app, searchGateway);
  registerInternalToolRoutes(app, tools, toolCallLogService);
  registerInternalModelRoutes(app, modelGateway, modelInvokeLogService);
  registerInternalUserMetaWriteRoute(app, memoryGateway);
  registerInternalUserMetaQueryRoute(app, memoryGateway);
  registerInternalMemoryWriteRoute(app, memoryGateway);
  registerInternalMemorySearchRoute(app, memoryGateway);
  registerInternalMemorySummarizeRoute(app, memoryGateway);
  registerInternalRecordsWriteRoute(app, recordsPlansGateway);
  registerInternalRecordsQueryRoute(app, recordsPlansGateway);
  registerInternalRecordsUpdateRoute(app, recordsPlansGateway);
  registerInternalPlansWriteRoute(app, recordsPlansGateway);
  registerInternalPlansQueryRoute(app, recordsPlansGateway);
  registerInternalPlansActivateRoute(app, recordsPlansGateway);
  registerInternalPlansPauseRoute(app, recordsPlansGateway);
  registerInternalPlansExpandRoute(app, recordsPlansGateway);
  registerIngestionUploadRoute(app, ingestionGateway);
  registerIngestionParseRoute(app, ingestionGateway);
  registerIngestionChunkRoute(app, ingestionGateway);
  registerIngestionEmbedRoute(app, ingestionGateway);
  registerIngestionIndexRoute(app, ingestionGateway);
  registerIngestionPublishRoute(app, ingestionGateway);

  app.post<{
    Body: InternalRuntimeEventsRequest;
  }>("/internal/runtime/events", async (request) => {
    const body = request.body;
    if (!body || !body.sessionId || !Array.isArray(body.events)) {
      return { ok: false };
    }
    await relayWithLogs.relay(body.sessionId, body.events);
    return { ok: true };
  });

  app.addHook("onReady", async () => {
    await prismaModule.prisma.connect();
    wsServer.install(app.server);
    void runtimeCacheService;
  });

  app.addHook("onClose", async () => {
    await prismaModule.prisma.disconnect();
  });

  return {
    app,
    runScheduler,
    runService,
    sessionManager,
    searchGateway,
    ingestionGateway,
    memoryGateway,
    tools,
  };
}

/**
 * 启动主服务
 *
 * 功能说明：
 * * 按环境变量或默认值启动 main-server
 *
 * @returns void
 */
async function start(): Promise<void> {
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? "0.0.0.0";
  const { app } = buildMainServer({ port, host });
  await app.listen({ port, host });
}

if (require.main === module) {
  void start();
}
