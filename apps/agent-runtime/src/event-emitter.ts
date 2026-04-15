/**
 * Runtime Core Agent 事件发送器
 *
 * 所属模块：
 * * agent-runtime
 *
 * 文件作用：
 * * 将 agent-loop 产生的内部事件回传到 main-server
 *
 * 主要功能：
 * * emit
 * * emitBatch
 *
 * 依赖：
 * * protocol 内部事件协议
 *
 * 注意事项：
 * * 目标地址固定为 main-server 的 /internal/runtime/events
 */

import type { AgentRuntimeEvent } from "protocol";

/**
 * 事件发送器
 *
 * 功能说明：
 * * 封装向主程序回传 runtime 事件的 HTTP 调用
 */
export class EventEmitter {
  /**
   * 构造发送器
   *
   * @param mainServerBaseUrl main-server 基础地址
   */
  constructor(private readonly mainServerBaseUrl: string) {}

  /**
   * 发送单个事件
   *
   * 功能说明：
   * * 将单个事件包装成批量格式并提交
   *
   * @param runId run ID
   * @param sessionId 会话 ID
   * @param event 内部事件
   * @returns void
   */
  async emit(
    runId: string,
    sessionId: string,
    event: AgentRuntimeEvent,
  ): Promise<void> {
    await this.emitBatch(runId, sessionId, [event]);
  }

  /**
   * 批量发送事件
   *
   * 功能说明：
   * * 向 main-server /internal/runtime/events 提交事件数组
   *
   * @param runId run ID
   * @param sessionId 会话 ID
   * @param events 内部事件列表
   * @returns void
   *
   * @throws Error 当回传请求失败
   */
  async emitBatch(
    runId: string,
    sessionId: string,
    events: AgentRuntimeEvent[],
  ): Promise<void> {
    const response = await fetch(
      `${this.mainServerBaseUrl}/internal/runtime/events`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          runId,
          sessionId,
          events,
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`Failed to emit runtime events: ${response.status}`);
    }
  }
}

