/**
 * Runtime Core WebSocket 消息处理器
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 处理客户端通过 websocket 发送的业务事件
 * * 将 message.create/run.cancel/ping 转发到对应服务层
 *
 * 主要功能：
 * * handle
 * * 处理 message.create
 * * 处理 run.cancel
 * * 处理 ping
 *
 * 依赖：
 * * protocol ws 事件类型
 * * session-manager
 * * run-service
 * * run-scheduler
 * * connection-manager
 *
 * 注意事项：
 * * 本层不直接操作 store，不直接调用 agent gateway
 */

import type {
  ClientMessageCreateEvent,
  ClientRunCancelEvent,
  ClientWsEvent,
} from "protocol";
import { ERROR_CODES } from "protocol";
import type { RunScheduler } from "scheduler-core";
import type { RunLogService } from "../modules/runtime/services/run-log.service";
import type { SessionManager } from "../runtime/session-manager";
import type { RunService } from "../runtime/run-service";
import type { ConnectionManager } from "./connection-manager";

/**
 * WebSocket 消息处理器
 *
 * 功能说明：
 * * 对外提供统一的消息入口并分发到具体处理分支
 */
export class WsMessageHandler {
  /**
   * 构造消息处理器
   *
   * @param sessionManager 会话管理器
   * @param runService run 生命周期服务
   * @param runScheduler 调度器
   * @param connectionManager 连接管理器
   */
  constructor(
    private readonly sessionManager: SessionManager,
    private readonly runService: RunService,
    private readonly runScheduler: RunScheduler,
    private readonly connectionManager: ConnectionManager,
    private readonly runLogService?: RunLogService,
  ) {}

  /**
   * 处理客户端消息
   *
   * 功能说明：
   * * 解析 JSON 并按 event 字段路由到对应处理函数
   *
   * @param connectionId 当前连接 ID
   * @param rawMessage 原始消息文本
   * @returns void
   */
  async handle(connectionId: string, rawMessage: string): Promise<void> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawMessage) as unknown;
    } catch {
      return;
    }

    if (!this.isClientEvent(parsed)) {
      return;
    }

    switch (parsed.event) {
      case "message.create":
        await this.handleMessageCreate(connectionId, parsed);
        break;
      case "run.cancel":
        await this.handleRunCancel(parsed);
        break;
      case "ping":
        this.connectionManager.send(connectionId, {
          event: "pong",
          ts: parsed.ts,
        });
        break;
      default:
        break;
    }
  }

  /**
   * 处理 message.create
   *
   * 功能说明：
   * * 校验 session 后创建 run
   * * 回传 run.started
   * * 提交调度并触发 dispatch
   *
   * @param connectionId 连接 ID
   * @param event 创建消息事件
   * @returns void
   */
  private async handleMessageCreate(
    connectionId: string,
    event: ClientMessageCreateEvent,
  ): Promise<void> {
    const session = await this.sessionManager.getSession(event.sessionId);
    if (!session) {
      this.connectionManager.send(connectionId, {
        event: "run.failed",
        sessionId: event.sessionId,
        runId: "unknown",
        code: ERROR_CODES.SESSION_NOT_FOUND,
        message: "Session not found",
      });
      return;
    }

    const run = await this.runService.createRun(
      event.sessionId,
      session.userId,
      event.input,
      {
        timeoutMs: event.options.timeoutMs,
        agentId: event.options.agentId,
        stream: event.options.stream,
      },
    );
    await this.runLogService?.onRunCreated(run.runId, {
      sessionId: run.sessionId,
      userId: run.userId,
      agentId: run.agentId,
      inputText: event.input.type === "text" ? event.input.text : undefined,
      timeoutMs: run.timeoutMs,
    });

    await this.runScheduler.submit(run.runId);
    this.connectionManager.send(connectionId, {
      event: "run.started",
      sessionId: event.sessionId,
      runId: run.runId,
      agentId: run.agentId,
      status: "queued",
    });
    await this.runScheduler.dispatchNext();
    await this.runLogService?.onRunStarted(run.runId, {
      status: "queued",
    });
  }

  /**
   * 处理 run.cancel
   *
   * 功能说明：
   * * 先标记业务层取消，再通知调度层取消
   *
   * @param event 取消事件
   * @returns void
   */
  private async handleRunCancel(event: ClientRunCancelEvent): Promise<void> {
    await this.runService.cancelRun(event.runId, event.reason);
    await this.runScheduler.cancel(event.runId);
    await this.runLogService?.onRunCanceled(event.runId, {
      reason: event.reason,
    });
  }

  /**
   * 校验是否为客户端事件
   *
   * 功能说明：
   * * 做最小结构判断，避免非法 payload
   *
   * @param value 待校验对象
   * @returns 是否符合客户端事件
   */
  private isClientEvent(value: unknown): value is ClientWsEvent {
    if (!value || typeof value !== "object") {
      return false;
    }
    const maybe = value as { event?: string };
    return (
      maybe.event === "message.create" ||
      maybe.event === "run.cancel" ||
      maybe.event === "ping"
    );
  }
}
