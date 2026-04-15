/**
 * Runtime Core 主服务 WebSocket 连接管理器
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 维护 connectionId 与 WebSocket 连接实例的映射关系
 * * 向指定连接发送标准化服务端事件
 *
 * 主要功能：
 * * 新增连接、查询连接、删除连接
 * * 按连接发送协议事件
 *
 * 依赖：
 * * ws
 * * protocol
 *
 * 注意事项：
 * * 本层只处理连接映射，不承担 run 或 session 业务逻辑
 */

import WebSocket from "ws";
import type { ServerWsEvent } from "protocol";

/**
 * 连接管理器
 *
 * 功能说明：
 * * 统一维护 connectionId 与 WebSocket 的生命周期
 */
export class ConnectionManager {
  private readonly connections = new Map<string, WebSocket>();

  /**
   * 注册连接
   *
   * 功能说明：
   * * 将 connectionId 与 socket 建立映射
   *
   * @param connectionId 连接 ID
   * @param socket WebSocket 连接对象
   * @returns void
   */
  add(connectionId: string, socket: WebSocket): void {
    this.connections.set(connectionId, socket);
  }

  /**
   * 获取连接
   *
   * 功能说明：
   * * 通过 connectionId 读取对应连接实例
   *
   * @param connectionId 连接 ID
   * @returns WebSocket 实例或 null
   */
  get(connectionId: string): WebSocket | null {
    return this.connections.get(connectionId) ?? null;
  }

  /**
   * 删除连接
   *
   * 功能说明：
   * * 清理连接映射，避免内存泄漏
   *
   * @param connectionId 连接 ID
   * @returns void
   */
  remove(connectionId: string): void {
    this.connections.delete(connectionId);
  }

  /**
   * 发送服务端事件
   *
   * 功能说明：
   * * 向指定连接发送标准协议事件
   *
   * @param connectionId 连接 ID
   * @param event 服务端事件
   * @returns 是否发送成功
   */
  send(connectionId: string, event: ServerWsEvent): boolean {
    const socket = this.connections.get(connectionId);
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    socket.send(JSON.stringify(event));
    return true;
  }
}

