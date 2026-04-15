/**
 * Runtime Core 内部事件转发器
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 将 agent-runtime 内部事件转换为外部 websocket 事件
 * * 在 done/error 终态时同步驱动 runService 更新状态
 *
 * 主要功能：
 * * relay
 * * 内部事件到外部事件的映射与发送
 *
 * 依赖：
 * * protocol 内部/外部事件类型
 * * session-manager
 * * connection-manager
 * * run-service
 *
 * 注意事项：
 * * 本层不直接读写 runStore，不直接操作 scheduler
 */

import type { AgentRuntimeEvent, ServerWsEvent } from "protocol";
import { ERROR_CODES } from "protocol";
import type { RunLogService } from "../modules/runtime/services/run-log.service";
import { ConnectionManager } from "../ws/connection-manager";
import { SessionManager } from "./session-manager";
import { RunService } from "./run-service";

/**
 * 事件转发器
 *
 * 功能说明：
 * * 负责内部事件与外部流式事件之间的边界转换
 */
export class EventRelay {
  /**
   * 构造事件转发器
   *
   * @param sessionManager 会话管理器
   * @param connectionManager 连接管理器
   * @param runService run 生命周期服务
   */
  constructor(
    private readonly sessionManager: SessionManager,
    private readonly connectionManager: ConnectionManager,
    private readonly runService: RunService,
    private readonly runLogService?: RunLogService,
  ) {}

  /**
   * 转发内部事件
   *
   * 功能说明：
   * * 将 runtime 事件转换后发送给 session 绑定的 websocket 连接
   * * 在 done/error 时同步更新 run 终态
   *
   * @param sessionId 会话 ID
   * @param events runtime 事件列表
   * @returns void
   */
  async relay(sessionId: string, events: AgentRuntimeEvent[]): Promise<void> {
    const session = await this.sessionManager.getSession(sessionId);
    if (!session || !session.connectionId) {
      return;
    }

    const runId = session.activeRunId;
    if (!runId) {
      return;
    }

    for (const event of events) {
      switch (event.type) {
        case "status": {
          // TODO: add audit logging and optional status event forwarding
          break;
        }
        case "delta": {
          await this.runLogService?.onRunStreaming(runId, {
            deltaSize: event.text.length,
          });
          this.send(session.connectionId, {
            event: "message.delta",
            sessionId,
            runId,
            delta: event.text,
          });
          break;
        }
        case "tool_call": {
          this.send(session.connectionId, {
            event: "run.tool_call",
            sessionId,
            runId,
            toolName: event.toolName,
            toolCallId: event.toolCallId,
            args: event.args,
          });
          break;
        }
        case "tool_result": {
          break;
        }
        case "done": {
          await this.runService.completeRun(runId);
          await this.runLogService?.onRunCompleted(runId, {
            outputText: event.outputText,
          });
          this.send(session.connectionId, {
            event: "run.completed",
            sessionId,
            runId,
            outputText: event.outputText,
          });
          break;
        }
        case "error": {
          await this.runService.failRun(runId, event.code, event.message);
          await this.runLogService?.onRunFailed(runId, {
            code: event.code,
            message: event.message,
          });
          this.send(session.connectionId, {
            event: "run.failed",
            sessionId,
            runId,
            code: event.code ?? ERROR_CODES.RUN_DISPATCH_FAILED,
            message: event.message,
          });
          break;
        }
        default: {
          break;
        }
      }
    }
  }

  /**
   * 发送事件到指定连接
   *
   * 功能说明：
   * * 统一封装 connectionManager.send 调用
   *
   * @param connectionId 连接 ID
   * @param event 服务端事件
   * @returns void
   */
  private send(connectionId: string, event: ServerWsEvent): void {
    this.connectionManager.send(connectionId, event);
  }
}
