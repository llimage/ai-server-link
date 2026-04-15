/**
 * Scheduler Core 调度策略定义
 *
 * 所属模块：
 * * scheduler-core
 *
 * 文件作用：
 * * 定义调度策略接口
 * * 提供默认调度策略实现
 *
 * 主要功能：
 * * 校验 session 是否可调度
 * * 选择目标 agent runtime
 *
 * 依赖：
 * * agent-registry
 * * runtime-core stores
 *
 * 注意事项：
 * * 同一 session 只能存在一个 active run
 */

import type { RunStore, SessionStore } from "runtime-core";
import { isTerminalRunStatus } from "runtime-core";
import type { AgentRuntimeInstance } from "./agent-registry";
import { InMemoryAgentRegistry } from "./agent-registry";

/**
 * 调度策略接口
 */
export interface DispatchPolicy {
  canDispatch(sessionId: string): Promise<boolean>;
  selectAgentRuntime(agentId: string): Promise<AgentRuntimeInstance | null>;
}

/**
 * 默认调度策略
 */
export class DefaultDispatchPolicy implements DispatchPolicy {
  /**
   * 构造默认调度策略
   *
   * 功能说明：
   * * 注入会话、运行存储与 agent registry
   *
   * @param sessionStore 会话存储
   * @param runStore 运行存储
   * @param agentRegistry runtime 注册表
   */
  constructor(
    private readonly sessionStore: SessionStore,
    private readonly runStore: RunStore,
    private readonly agentRegistry: InMemoryAgentRegistry,
  ) {}

  /**
   * 判断 session 是否允许调度
   *
   * 功能说明：
   * * 同一 session 若已有非终态 active run，则不可再调度
   *
   * @param sessionId 会话 ID
   * @returns 是否可调度
   */
  async canDispatch(sessionId: string): Promise<boolean> {
    const session = await this.sessionStore.get(sessionId);
    if (!session || !session.activeRunId) {
      return true;
    }
    const activeRun = await this.runStore.get(session.activeRunId);
    if (!activeRun) {
      return true;
    }
    return isTerminalRunStatus(activeRun.status);
  }

  /**
   * 选择目标 agent runtime
   *
   * 功能说明：
   * * 优先选 healthy 且 activeRuns 最少的实例
   *
   * @param agentId agent 类型 ID
   * @returns 目标实例或 null
   */
  async selectAgentRuntime(
    agentId: string,
  ): Promise<AgentRuntimeInstance | null> {
    const candidates = await this.agentRegistry.getAvailable(agentId);
    if (!candidates.length) {
      return null;
    }
    const healthy = candidates.filter((item) => item.status === "healthy");
    const pool = healthy.length ? healthy : candidates;
    return pool.sort((a, b) => a.activeRuns - b.activeRuns)[0] ?? null;
  }
}
