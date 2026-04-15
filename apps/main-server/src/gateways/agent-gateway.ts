/**
 * Runtime Core Agent Runtime 网关
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 封装主程序到 agent-runtime 的 HTTP 调用
 * * 提供 start/cancel 的统一请求入口
 *
 * 主要功能：
 * * startRun
 * * cancelRun
 * * healthcheck（可选）
 *
 * 依赖：
 * * protocol 内部请求响应类型
 *
 * 注意事项：
 * * 本层只做 HTTP client，不承担调度策略决策
 */

import type {
  InternalAgentCancelRequest,
  InternalAgentRunRequest,
  InternalAgentRunResponse,
} from "protocol";

/**
 * Agent Runtime 调用适配器
 *
 * 功能说明：
 * * 通过 HTTP 与 agent-runtime 建立最小通信能力
 */
export class AgentGateway {
  /**
   * 启动 run
   *
   * 功能说明：
   * * 请求 agent-runtime 异步受理并执行指定 run
   *
   * @param agentRuntimeBaseUrl agent runtime 基础地址
   * @param payload 运行请求
   * @returns 受理结果
   *
   * @throws Error 当 HTTP 状态失败或响应异常
   */
  async startRun(
    agentRuntimeBaseUrl: string,
    payload: InternalAgentRunRequest,
  ): Promise<{ accepted: boolean }> {
    // TODO: add retry / timeout / circuit breaker in later phase
    const response = await fetch(
      `${agentRuntimeBaseUrl}/internal/agent/run`,
      this.buildJsonRequest(payload),
    );
    if (!response.ok) {
      throw new Error(`Agent run request failed with ${response.status}`);
    }
    const body = (await response.json()) as InternalAgentRunResponse;
    return { accepted: body.accepted };
  }

  /**
   * 取消 run
   *
   * 功能说明：
   * * 请求 agent-runtime 标记 run 取消
   *
   * @param agentRuntimeBaseUrl agent runtime 基础地址
   * @param payload 取消请求
   * @returns 受理结果
   *
   * @throws Error 当 HTTP 状态失败
   */
  async cancelRun(
    agentRuntimeBaseUrl: string,
    payload: InternalAgentCancelRequest,
  ): Promise<{ accepted: boolean }> {
    // TODO: add retry / timeout / circuit breaker in later phase
    const response = await fetch(
      `${agentRuntimeBaseUrl}/internal/agent/cancel`,
      this.buildJsonRequest(payload),
    );
    if (!response.ok) {
      throw new Error(`Agent cancel request failed with ${response.status}`);
    }
    return { accepted: true };
  }

  /**
   * 健康检查
   *
   * 功能说明：
   * * 检查 agent runtime 可达性
   *
   * @param agentRuntimeBaseUrl agent runtime 基础地址
   * @returns 健康检查结果
   */
  async healthcheck(agentRuntimeBaseUrl: string): Promise<boolean> {
    const response = await fetch(`${agentRuntimeBaseUrl}/internal/agent/health`);
    return response.ok;
  }

  /**
   * 生成 JSON 请求参数
   *
   * 功能说明：
   * * 统一构造 fetch 请求配置
   *
   * @param payload 请求体
   * @returns fetch 参数
   */
  private buildJsonRequest(payload: unknown): RequestInit {
    return {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    };
  }
}

