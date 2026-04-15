/**
 * Runtime Core WebSocket 入口服务
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 在主程序中接入 websocket upgrade 入口
 * * 完成 connection 创建、session 绑定与消息分发
 *
 * 主要功能：
 * * install
 * * 连接建立时发送 session.ready
 * * 转交 ws 消息到消息处理器
 *
 * 依赖：
 * * ws
 * * protocol
 * * connection-manager
 * * session-manager
 * * ws-message-handler
 *
 * 注意事项：
 * * 本层不直接创建 run，不直接调用 agent runtime
 */

import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import WebSocket, { WebSocketServer } from "ws";
import type { Session } from "runtime-core";
import { ConnectionManager } from "./connection-manager";
import { SessionManager } from "../runtime/session-manager";
import { WsMessageHandler } from "./ws-message-handler";

/**
 * WebSocket 入口服务
 *
 * 功能说明：
 * * 接管 HTTP upgrade 并建立 WebSocket 生命周期处理
 */
export class RuntimeWsServer {
  private readonly wsServer = new WebSocketServer({ noServer: true });

  /**
   * 构造 WebSocket 服务
   *
   * @param connectionManager 连接管理器
   * @param sessionManager 会话管理器
   * @param wsMessageHandler 消息处理器
   */
  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly sessionManager: SessionManager,
    private readonly wsMessageHandler: WsMessageHandler,
  ) {}

  /**
   * 安装到 HTTP Server
   *
   * 功能说明：
   * * 监听 upgrade 请求并接入 ws 通道
   *
   * @param server HTTP 服务实例
   * @returns void
   */
  install(server: Server): void {
    server.on("upgrade", (request, socket, head) => {
      if (!(request.url ?? "").startsWith("/ws")) {
        socket.destroy();
        return;
      }
      this.wsServer.handleUpgrade(request, socket, head, (ws) => {
        this.wsServer.emit("connection", ws, request);
      });
    });

    this.wsServer.on("connection", (socket, request) => {
      void this.handleConnection(socket, request.headers);
    });
  }

  /**
   * 处理新连接
   *
   * 功能说明：
   * * 创建 connectionId
   * * 创建或恢复 session
   * * 发送 session.ready
   * * 绑定消息/关闭事件处理
   *
   * @param socket WebSocket 连接
   * @param headers 请求头
   * @returns void
   */
  private async handleConnection(
    socket: WebSocket,
    headers: NodeJS.Dict<string | string[]>,
  ): Promise<void> {
    const connectionId = `conn_${randomUUID()}`;
    const userId = this.readSingleHeader(headers["x-user-id"]) ?? "mock-user";
    const requestedSessionId = this.readSingleHeader(headers["x-session-id"]);

    this.connectionManager.add(connectionId, socket);
    const session = await this.createOrRestoreSession(
      userId,
      connectionId,
      requestedSessionId,
    );

    this.connectionManager.send(connectionId, {
      event: "session.ready",
      sessionId: session.sessionId,
      userId: session.userId,
      connectionId,
    });

    socket.on("message", (raw) => {
      const rawText = typeof raw === "string" ? raw : raw.toString("utf8");
      void this.wsMessageHandler.handle(connectionId, rawText);
    });

    socket.on("close", () => {
      void this.sessionManager.unbindConnection(session.sessionId);
      this.connectionManager.remove(connectionId);
    });
  }

  /**
   * 创建或恢复会话
   *
   * 功能说明：
   * * 优先恢复请求头指定的 session
   * * 恢复失败时创建新会话
   *
   * @param userId 用户 ID
   * @param connectionId 连接 ID
   * @param requestedSessionId 请求会话 ID
   * @returns 会话对象
   */
  private async createOrRestoreSession(
    userId: string,
    connectionId: string,
    requestedSessionId?: string,
  ): Promise<Session> {
    if (requestedSessionId) {
      const existing = await this.sessionManager.getSession(requestedSessionId);
      if (existing && existing.userId === userId && existing.status !== "closed") {
        return this.sessionManager.bindConnection(existing.sessionId, connectionId);
      }
    }
    return this.sessionManager.createSession(userId, connectionId);
  }

  /**
   * 读取单值请求头
   *
   * 功能说明：
   * * 从 string | string[] 结构中提取首个值
   *
   * @param header 请求头值
   * @returns 字符串值或 undefined
   */
  private readSingleHeader(header?: string | string[]): string | undefined {
    if (!header) {
      return undefined;
    }
    if (Array.isArray(header)) {
      return header[0];
    }
    return header;
  }
}

