/**
 * Scheduler Core Agent Registry 定义
 *
 * 所属模块：
 * * scheduler-core
 *
 * 文件作用：
 * * 管理 agent runtime 实例状态
 * * 为调度策略提供可用实例选择基础
 *
 * 主要功能：
 * * register
 * * updateHeartbeat
 * * getAvailable
 * * increment/decrement activeRuns
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 本批次使用内存实现，不持久化到外部存储
 */

/**
 * Agent Runtime 实例定义
 */
export interface AgentRuntimeInstance {
  agentRuntimeId: string;
  agentId: string;
  status: "healthy" | "busy" | "unhealthy";
  activeRuns: number;
  lastHeartbeatAt: string;
  baseUrl: string;
}

/**
 * 内存版 Agent Registry
 */
export class InMemoryAgentRegistry {
  private readonly instances = new Map<string, AgentRuntimeInstance>();

  /**
   * 注册实例
   *
   * 功能说明：
   * * 新增或覆盖注册 runtime 实例
   *
   * @param instance runtime 实例
   * @returns void
   */
  async register(instance: AgentRuntimeInstance): Promise<void> {
    this.instances.set(instance.agentRuntimeId, instance);
  }

  /**
   * 更新心跳信息
   *
   * 功能说明：
   * * 按 ID 更新实例的局部字段
   *
   * @param agentRuntimeId runtime 实例 ID
   * @param patch 部分字段
   * @returns void
   */
  async updateHeartbeat(
    agentRuntimeId: string,
    patch: Partial<Omit<AgentRuntimeInstance, "agentRuntimeId" | "agentId">>,
  ): Promise<void> {
    const current = this.instances.get(agentRuntimeId);
    if (!current) {
      return;
    }
    this.instances.set(agentRuntimeId, {
      ...current,
      ...patch,
    });
  }

  /**
   * 获取可用实例
   *
   * 功能说明：
   * * 根据 agentId 筛选 healthy/busy 实例
   *
   * @param agentId agent 类型 ID
   * @returns 候选实例列表
   */
  async getAvailable(agentId: string): Promise<AgentRuntimeInstance[]> {
    return [...this.instances.values()].filter(
      (item) =>
        item.agentId === agentId &&
        (item.status === "healthy" || item.status === "busy"),
    );
  }

  /**
   * 递增活跃运行数
   *
   * 功能说明：
   * * 在调度成功后增加实例运行计数
   *
   * @param agentRuntimeId runtime 实例 ID
   * @returns void
   */
  async incrementActiveRuns(agentRuntimeId: string): Promise<void> {
    const current = this.instances.get(agentRuntimeId);
    if (!current) {
      return;
    }
    this.instances.set(agentRuntimeId, {
      ...current,
      activeRuns: current.activeRuns + 1,
      status: "busy",
    });
  }

  /**
   * 递减活跃运行数
   *
   * 功能说明：
   * * 在运行完成后减少实例运行计数
   *
   * @param agentRuntimeId runtime 实例 ID
   * @returns void
   */
  async decrementActiveRuns(agentRuntimeId: string): Promise<void> {
    const current = this.instances.get(agentRuntimeId);
    if (!current) {
      return;
    }
    const nextActiveRuns = Math.max(0, current.activeRuns - 1);
    this.instances.set(agentRuntimeId, {
      ...current,
      activeRuns: nextActiveRuns,
      status: nextActiveRuns > 0 ? "busy" : "healthy",
    });
  }
}
