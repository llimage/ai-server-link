/**
 * Runtime Core Agent 执行循环（Mock）
 *
 * 所属模块：
 * * agent-runtime
 *
 * 文件作用：
 * * 提供最小可运行的 mock agent 执行流
 * * 按阶段发出 status、delta、done 事件
 *
 * 主要功能：
 * * run
 * * 取消检查与中断
 *
 * 依赖：
 * * protocol 内部请求/事件类型
 * * event-emitter
 * * cancel-registry
 *
 * 注意事项：
 * * 当前批次不接入真实模型调用，仅用于 Runtime 骨架联调
 */

import {
  ERROR_CODES,
  type InternalAgentRunRequest,
  type ModelInvokeRequest,
} from "protocol";
import { CancelRegistry } from "./cancel-registry";
import { EventEmitter } from "./event-emitter";
import { ModelClient } from "./model-client";
import { ToolClient } from "./tool-client";

/**
 * Agent 执行循环
 *
 * 功能说明：
 * * 执行 mock 流程并持续回传运行事件
 */
export class AgentLoop {
  /**
   * 构造执行循环
   *
   * @param eventEmitter 事件发送器
   * @param cancelRegistry 取消状态注册表
   */
  constructor(
    private readonly eventEmitter: EventEmitter,
    private readonly cancelRegistry: CancelRegistry,
    private readonly toolClient: ToolClient,
    private readonly modelClient: ModelClient,
  ) {}

  /**
   * 执行 run
   *
   * 功能说明：
   * * 按 mock 流程依次发送 status、delta、delta、done 事件
   * * 每步执行前检查取消状态
   *
   * @param request 运行请求
   * @returns void
   */
  async run(request: InternalAgentRunRequest): Promise<void> {
    const lower = request.input.text.toLowerCase();
    if (lower.includes("record")) {
      await this.runRecordsDemoFlow(request);
      return;
    }
    if (lower.includes("plan")) {
      await this.runPlansDemoFlow(request);
      return;
    }
    if (lower.includes("remember key")) {
      await this.runUserMetaDemoFlow(request);
      return;
    }
    if (lower.includes("remember text")) {
      await this.runMemoryDemoFlow(request);
      return;
    }
    if (request.input.text.toLowerCase().includes("search")) {
      await this.runSearchDemoFlow(request);
      return;
    }

    await this.runModelInvokeFlow(request);
  }

  /**
   * 执行搜索演示流程
   *
   * 功能说明：
   * * 在输入包含 search 时触发 search.query 工具调用闭环
   *
   * @param request 运行请求
   * @returns void
   */
  private async runSearchDemoFlow(request: InternalAgentRunRequest): Promise<void> {
    try {
      await this.assertNotCancelled(request.runId, request.sessionId);
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "status",
        status: "thinking",
        ts: new Date().toISOString(),
      });

      const toolCallId = `tool_${request.runId}`;
      const args = {
        space: "knowledge",
        query: "hello",
        filters: {
          tenant_id: "demo",
        },
        topK: 5,
        mode: "hybrid",
      };

      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_call",
        toolName: "search.query",
        toolCallId,
        args,
        ts: new Date().toISOString(),
      });

      const result = (await this.toolClient.executeTool({
        toolName: "search.query",
        args,
      })) as { items?: unknown[] };

      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_result",
        toolName: "search.query",
        toolCallId,
        result,
        ts: new Date().toISOString(),
      });

      const count = Array.isArray(result?.items) ? result.items.length : 0;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "delta",
        text: `search returned ${count} results`,
        ts: new Date().toISOString(),
      });

      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "done",
        outputText: `search returned ${count} results`,
        ts: new Date().toISOString(),
      });
      // TODO: replace mock delta flow with real model invocation in later phase
    } finally {
      this.cancelRegistry.clear(request.runId);
    }
  }

  /**
   * 执行 user.meta 演示流程
   *
   * 功能说明：
   * * 调用 user.meta.write 后再调用 user.meta.query，返回演示 delta
   *
   * @param request 运行请求
   * @returns void
   */
  private async runUserMetaDemoFlow(
    request: InternalAgentRunRequest,
  ): Promise<void> {
    try {
      await this.assertNotCancelled(request.runId, request.sessionId);
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "status",
        status: "thinking",
        ts: new Date().toISOString(),
      });

      const { key, value } = this.extractRememberKeyPayload(request.input.text);
      const writeArgs = {
        userId: request.userId,
        items: [
          {
            key,
            value,
            source: "agent-runtime.demo",
            tags: ["runtime.demo", "meta"],
          },
        ],
      };
      const writeToolCallId = `tool_meta_write_${request.runId}`;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_call",
        toolName: "user.meta.write",
        toolCallId: writeToolCallId,
        args: writeArgs,
        ts: new Date().toISOString(),
      });
      const writeResult = await this.toolClient.executeTool({
        toolName: "user.meta.write",
        args: writeArgs,
      });
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_result",
        toolName: "user.meta.write",
        toolCallId: writeToolCallId,
        result: writeResult,
        ts: new Date().toISOString(),
      });

      const queryArgs = {
        userId: request.userId,
        keys: [key],
      };
      const queryToolCallId = `tool_meta_query_${request.runId}`;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_call",
        toolName: "user.meta.query",
        toolCallId: queryToolCallId,
        args: queryArgs,
        ts: new Date().toISOString(),
      });
      const queryResult = (await this.toolClient.executeTool({
        toolName: "user.meta.query",
        args: queryArgs,
      })) as { items?: unknown[] };
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_result",
        toolName: "user.meta.query",
        toolCallId: queryToolCallId,
        result: queryResult,
        ts: new Date().toISOString(),
      });

      const count = Array.isArray(queryResult.items) ? queryResult.items.length : 0;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "delta",
        text: `metadata saved and queried: key=${key}, items=${count}`,
        ts: new Date().toISOString(),
      });
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "done",
        outputText: `metadata saved and queried: key=${key}, items=${count}`,
        ts: new Date().toISOString(),
      });
    } finally {
      this.cancelRegistry.clear(request.runId);
    }
  }

  /**
   * 执行 memory 演示流程
   *
   * 功能说明：
   * * 调用 memory.write 后再调用 memory.search，返回演示 delta
   *
   * @param request 运行请求
   * @returns void
   */
  private async runMemoryDemoFlow(request: InternalAgentRunRequest): Promise<void> {
    try {
      await this.assertNotCancelled(request.runId, request.sessionId);
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "status",
        status: "thinking",
        ts: new Date().toISOString(),
      });

      const content = this.extractRememberTextPayload(request.input.text);
      const writeArgs = {
        userId: request.userId,
        content,
        kind: "note",
        source: "agent-runtime.demo",
        tags: ["runtime.demo", "memory"],
      };
      const writeToolCallId = `tool_memory_write_${request.runId}`;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_call",
        toolName: "memory.write",
        toolCallId: writeToolCallId,
        args: writeArgs,
        ts: new Date().toISOString(),
      });
      const writeResult = await this.toolClient.executeTool({
        toolName: "memory.write",
        args: writeArgs,
      });
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_result",
        toolName: "memory.write",
        toolCallId: writeToolCallId,
        result: writeResult,
        ts: new Date().toISOString(),
      });

      const searchArgs = {
        userId: request.userId,
        query: content,
        topK: 3,
      };
      const searchToolCallId = `tool_memory_search_${request.runId}`;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_call",
        toolName: "memory.search",
        toolCallId: searchToolCallId,
        args: searchArgs,
        ts: new Date().toISOString(),
      });
      const searchResult = (await this.toolClient.executeTool({
        toolName: "memory.search",
        args: searchArgs,
      })) as { items?: unknown[] };
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_result",
        toolName: "memory.search",
        toolCallId: searchToolCallId,
        result: searchResult,
        ts: new Date().toISOString(),
      });

      const count = Array.isArray(searchResult.items) ? searchResult.items.length : 0;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "delta",
        text: `memory write/search done: items=${count}`,
        ts: new Date().toISOString(),
      });
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "done",
        outputText: `memory write/search done: items=${count}`,
        ts: new Date().toISOString(),
      });
    } finally {
      this.cancelRegistry.clear(request.runId);
    }
  }

  /**
   * 执行 records 演示流程
   *
   * 功能说明：
   * * 调用 records.write 后再调用 records.query，返回演示 delta
   *
   * @param request 运行请求
   * @returns 无返回值
   */
  private async runRecordsDemoFlow(request: InternalAgentRunRequest): Promise<void> {
    try {
      await this.assertNotCancelled(request.runId, request.sessionId);
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "status",
        status: "thinking",
        ts: new Date().toISOString(),
      });

      const { key, value } = this.extractRecordPayload(request.input.text);
      const writeArgs = {
        userId: request.userId,
        space: "general",
        type: "note",
        payload: { [key]: value },
        tags: ["runtime.demo", "records"],
      };
      const writeToolCallId = `tool_records_write_${request.runId}`;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_call",
        toolName: "records.write",
        toolCallId: writeToolCallId,
        args: writeArgs,
        ts: new Date().toISOString(),
      });
      const writeResult = await this.toolClient.executeTool({
        toolName: "records.write",
        args: writeArgs,
      });
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_result",
        toolName: "records.write",
        toolCallId: writeToolCallId,
        result: writeResult,
        ts: new Date().toISOString(),
      });

      const queryArgs = {
        userId: request.userId,
        space: "general",
        type: "note",
        limit: 3,
      };
      const queryToolCallId = `tool_records_query_${request.runId}`;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_call",
        toolName: "records.query",
        toolCallId: queryToolCallId,
        args: queryArgs,
        ts: new Date().toISOString(),
      });
      const queryResult = (await this.toolClient.executeTool({
        toolName: "records.query",
        args: queryArgs,
      })) as { items?: unknown[] };
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_result",
        toolName: "records.query",
        toolCallId: queryToolCallId,
        result: queryResult,
        ts: new Date().toISOString(),
      });

      const count = Array.isArray(queryResult.items) ? queryResult.items.length : 0;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "delta",
        text: `records write/query done: items=${count}`,
        ts: new Date().toISOString(),
      });
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "done",
        outputText: `records write/query done: items=${count}`,
        ts: new Date().toISOString(),
      });
    } finally {
      this.cancelRegistry.clear(request.runId);
    }
  }

  /**
   * 执行 plans 演示流程
   *
   * 功能说明：
   * * 调用 plans.write/activate/query/expand 形成最小计划闭环
   *
   * @param request 运行请求
   * @returns 无返回值
   */
  private async runPlansDemoFlow(request: InternalAgentRunRequest): Promise<void> {
    try {
      await this.assertNotCancelled(request.runId, request.sessionId);
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "status",
        status: "thinking",
        ts: new Date().toISOString(),
      });

      const writeArgs = {
        userId: request.userId,
        space: "general",
        type: "routine",
        payload: {
          title: "demo plan",
          prompt: request.input.text,
        },
      };
      const writeToolCallId = `tool_plans_write_${request.runId}`;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_call",
        toolName: "plans.write",
        toolCallId: writeToolCallId,
        args: writeArgs,
        ts: new Date().toISOString(),
      });
      const writeResult = (await this.toolClient.executeTool({
        toolName: "plans.write",
        args: writeArgs,
      })) as { planId?: string };
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_result",
        toolName: "plans.write",
        toolCallId: writeToolCallId,
        result: writeResult,
        ts: new Date().toISOString(),
      });

      const planId = writeResult.planId ?? "";
      const activateArgs = { planId };
      const activateToolCallId = `tool_plans_activate_${request.runId}`;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_call",
        toolName: "plans.activate",
        toolCallId: activateToolCallId,
        args: activateArgs,
        ts: new Date().toISOString(),
      });
      const activateResult = await this.toolClient.executeTool({
        toolName: "plans.activate",
        args: activateArgs,
      });
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_result",
        toolName: "plans.activate",
        toolCallId: activateToolCallId,
        result: activateResult,
        ts: new Date().toISOString(),
      });

      const queryArgs = {
        userId: request.userId,
        space: "general",
        limit: 3,
      };
      const queryToolCallId = `tool_plans_query_${request.runId}`;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_call",
        toolName: "plans.query",
        toolCallId: queryToolCallId,
        args: queryArgs,
        ts: new Date().toISOString(),
      });
      const queryResult = (await this.toolClient.executeTool({
        toolName: "plans.query",
        args: queryArgs,
      })) as { items?: unknown[] };
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_result",
        toolName: "plans.query",
        toolCallId: queryToolCallId,
        result: queryResult,
        ts: new Date().toISOString(),
      });

      const expandArgs = {
        planId,
        date: new Date().toISOString().slice(0, 10),
      };
      const expandToolCallId = `tool_plans_expand_${request.runId}`;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_call",
        toolName: "plans.expand",
        toolCallId: expandToolCallId,
        args: expandArgs,
        ts: new Date().toISOString(),
      });
      const expandResult = (await this.toolClient.executeTool({
        toolName: "plans.expand",
        args: expandArgs,
      })) as { items?: unknown[] };
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "tool_result",
        toolName: "plans.expand",
        toolCallId: expandToolCallId,
        result: expandResult,
        ts: new Date().toISOString(),
      });

      const count = Array.isArray(expandResult.items) ? expandResult.items.length : 0;
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "delta",
        text: `plans write/activate/query/expand done: items=${count}`,
        ts: new Date().toISOString(),
      });
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "done",
        outputText: `plans write/activate/query/expand done: items=${count}`,
        ts: new Date().toISOString(),
      });
    } finally {
      this.cancelRegistry.clear(request.runId);
    }
  }

  /**
   * 执行模型调用流程
   *
   * 功能说明：
   * * 普通对话默认通过 model-client 请求 main-server 的 model handler
   * * 将 model stream events 转换为 runtime 事件并转发
   *
   * @param request 运行请求
   * @returns 无返回值
   */
  private async runModelInvokeFlow(request: InternalAgentRunRequest): Promise<void> {
    try {
      await this.assertNotCancelled(request.runId, request.sessionId);
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "status",
        status: "thinking",
        ts: new Date().toISOString(),
      });

      const invokeRequest: ModelInvokeRequest = {
        runId: request.runId,
        sessionId: request.sessionId,
        userId: request.userId,
        modelId: "mock-general",
        preferredModelId: "mock-general",
        messages: [
          {
            role: "user",
            content: request.input.text,
          },
        ],
        stream: request.stream ?? true,
        requiresStreaming: request.stream ?? true,
        timeoutMs: request.timeoutMs,
      };
      const response =
        request.stream ?? true
          ? await this.modelClient.streamInvokeModel(invokeRequest)
          : await this.modelClient.invokeModel(invokeRequest);

      let outputText = "";
      for (const event of response.events) {
        await this.assertNotCancelled(request.runId, request.sessionId);
        if (event.type === "delta") {
          outputText += event.text;
          await this.eventEmitter.emit(request.runId, request.sessionId, {
            type: "delta",
            text: event.text,
            ts: new Date().toISOString(),
          });
        }
        if (event.type === "error") {
          await this.eventEmitter.emit(request.runId, request.sessionId, {
            type: "error",
            code: event.code,
            message: event.message,
            ts: new Date().toISOString(),
          });
          return;
        }
      }
      await this.eventEmitter.emit(request.runId, request.sessionId, {
        type: "done",
        outputText,
        ts: new Date().toISOString(),
      });
    } finally {
      this.cancelRegistry.clear(request.runId);
    }
  }

  /**
   * 提取 remember key 输入
   *
   * @param input 原始输入
   * @returns key/value
   */
  private extractRememberKeyPayload(input: string): { key: string; value: string } {
    const matched = input.match(/remember key\s+([a-zA-Z0-9_.-]+)\s*=\s*(.+)$/i);
    if (!matched) {
      return { key: "note", value: input.trim() };
    }
    return {
      key: matched[1]?.trim() || "note",
      value: matched[2]?.trim() || "",
    };
  }

  /**
   * 提取 remember text 输入
   *
   * @param input 原始输入
   * @returns 记忆内容
   */
  private extractRememberTextPayload(input: string): string {
    const matched = input.match(/remember text\s+(.+)$/i);
    if (!matched) {
      return input.trim();
    }
    return matched[1]?.trim() || input.trim();
  }

  /**
   * 提取 record 输入
   *
   * 功能说明：
   * * 解析形如 please record key=value 的文本
   *
   * @param input 原始输入
   * @returns key/value
   */
  private extractRecordPayload(input: string): { key: string; value: string } {
    const matched = input.match(/record\s+([a-zA-Z0-9_.-]+)\s*=\s*(.+)$/i);
    if (!matched) {
      return { key: "note", value: input.trim() };
    }
    return {
      key: matched[1]?.trim() || "note",
      value: matched[2]?.trim() || "",
    };
  }

  /**
   * 校验 run 是否已取消
   *
   * 功能说明：
   * * 若发现取消标记，立即回传 error 并抛出中断异常
   *
   * @param runId run ID
   * @param sessionId 会话 ID
   * @returns void
   *
   * @throws Error 当 run 已取消
   */
  private async assertNotCancelled(
    runId: string,
    sessionId: string,
  ): Promise<void> {
    if (!this.cancelRegistry.isCancelled(runId)) {
      return;
    }
    await this.eventEmitter.emit(runId, sessionId, {
      type: "error",
      code: ERROR_CODES.RUN_CANCELLED,
      message: "Run cancelled",
      ts: new Date().toISOString(),
    });
    throw new Error("Run cancelled");
  }

  /**
   * 睡眠指定毫秒
   *
   * 功能说明：
   * * 用于模拟流式执行间隔
   *
   * @param ms 毫秒数
   * @returns Promise<void>
   */
  private async sleep(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
