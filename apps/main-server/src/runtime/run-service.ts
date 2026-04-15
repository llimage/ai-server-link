/**
 * Runtime Core 运行管理服务
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 封装 run 的创建、状态变更、完成、失败、取消生命周期
 * * 统一维护 session.activeRunId 与 run 状态的一致性
 *
 * 主要功能：
 * * createRun
 * * getRun
 * * markRunStatus
 * * completeRun
 * * failRun
 * * cancelRun
 *
 * 依赖：
 * * runtime-core run/session store
 * * runtime-core 状态机与错误工具
 * * protocol 错误码
 *
 * 注意事项：
 * * createRun 必须严格执行单 session 单 active run 约束
 */

import { randomUUID } from "node:crypto";
import { ERROR_CODES } from "protocol";
import {
  assertValidRunTransition,
  createRuntimeError,
  isTerminalRunStatus,
  type Run,
  type RunInput,
  type RunStatus,
  type RunStore,
  type SessionStore,
} from "runtime-core";

/**
 * 运行选项
 */
export interface CreateRunOptions {
  agentId?: string;
  timeoutMs?: number;
  stream?: boolean;
}

/**
 * Run 生命周期服务
 *
 * 功能说明：
 * * 管理 run 状态迁移并保持会话 activeRunId 正确
 */
export class RunService {
  /**
   * 构造 run 服务
   *
   * @param runStore run 存储
   * @param sessionStore session 存储
   */
  constructor(
    private readonly runStore: RunStore,
    private readonly sessionStore: SessionStore,
  ) {}

  /**
   * 创建 run
   *
   * 功能说明：
   * * 校验会话是否已有 active run
   * * 新建 run 并写入 created 状态
   * * 将 session.activeRunId 绑定到新 run
   *
   * @param sessionId 会话 ID
   * @param userId 用户 ID
   * @param input 运行输入
   * @param options 运行选项
   * @returns 新建 run
   *
   * @throws RuntimeError 当会话不存在或已存在 active run
   */
  async createRun(
    sessionId: string,
    userId: string,
    input: RunInput,
    options: CreateRunOptions = {},
  ): Promise<Run> {
    const session = await this.sessionStore.get(sessionId);
    if (!session) {
      throw createRuntimeError(
        ERROR_CODES.SESSION_NOT_FOUND,
        "Session not found for createRun",
        { sessionId },
      );
    }

    if (session.activeRunId) {
      const current = await this.runStore.get(session.activeRunId);
      if (current && !isTerminalRunStatus(current.status)) {
        throw createRuntimeError(
          ERROR_CODES.ACTIVE_RUN_EXISTS,
          "Session already has active run",
          { sessionId, activeRunId: current.runId },
        );
      }
    }

    const now = new Date().toISOString();
    const run: Run = {
      runId: `run_${randomUUID()}`,
      sessionId,
      userId,
      agentId: options.agentId ?? "general.default",
      status: "created",
      input,
      timeoutMs: options.timeoutMs ?? 30000,
      createdAt: now,
    };
    await this.runStore.set(run);

    session.activeRunId = run.runId;
    session.updatedAt = now;
    await this.sessionStore.set(session);
    return run;
  }

  /**
   * 获取 run
   *
   * 功能说明：
   * * 根据 runId 查询 run
   *
   * @param runId run ID
   * @returns run 或 null
   */
  async getRun(runId: string): Promise<Run | null> {
    return this.runStore.get(runId);
  }

  /**
   * 标记 run 状态
   *
   * 功能说明：
   * * 校验状态迁移并更新 run 基础时间字段
   *
   * @param runId run ID
   * @param status 目标状态
   * @returns 更新后的 run
   */
  async markRunStatus(runId: string, status: RunStatus): Promise<Run> {
    const run = await this.mustGetRun(runId);
    assertValidRunTransition(run.status, status);
    run.status = status;
    if (status === "running" && !run.startedAt) {
      run.startedAt = new Date().toISOString();
    }
    if (isTerminalRunStatus(status)) {
      run.finishedAt = new Date().toISOString();
      await this.clearSessionActiveRun(run);
    }
    await this.runStore.set(run);
    return run;
  }

  /**
   * 完成 run
   *
   * 功能说明：
   * * 将 run 标记为 completed，并释放 session.activeRunId
   *
   * @param runId run ID
   * @param usage 可选资源使用信息（预留）
   * @returns 更新后的 run
   */
  async completeRun(
    runId: string,
    usage?: Record<string, unknown>,
  ): Promise<Run> {
    const run = await this.mustGetRun(runId);
    if (!isTerminalRunStatus(run.status)) {
      assertValidRunTransition(run.status, "completed");
      run.status = "completed";
      run.finishedAt = new Date().toISOString();
      if (usage) {
        run.errorMessage = undefined;
      }
      await this.runStore.set(run);
      await this.clearSessionActiveRun(run);
    }
    return run;
  }

  /**
   * 标记 run 失败
   *
   * 功能说明：
   * * 将 run 标记为 failed 并记录错误码与错误消息
   *
   * @param runId run ID
   * @param code 错误码
   * @param message 错误消息
   * @returns 更新后的 run
   */
  async failRun(runId: string, code: string, message: string): Promise<Run> {
    const run = await this.mustGetRun(runId);
    if (!isTerminalRunStatus(run.status)) {
      assertValidRunTransition(run.status, "failed");
      run.status = "failed";
      run.errorCode = code;
      run.errorMessage = message;
      run.finishedAt = new Date().toISOString();
      await this.runStore.set(run);
      await this.clearSessionActiveRun(run);
    }
    return run;
  }

  /**
   * 取消 run
   *
   * 功能说明：
   * * 将 run 标记为 cancelled，并写入取消原因
   *
   * @param runId run ID
   * @param reason 取消原因
   * @returns 更新后的 run
   */
  async cancelRun(runId: string, reason?: string): Promise<Run> {
    const run = await this.mustGetRun(runId);
    if (!isTerminalRunStatus(run.status)) {
      assertValidRunTransition(run.status, "cancelled");
      run.status = "cancelled";
      run.errorCode = ERROR_CODES.RUN_CANCELLED;
      run.errorMessage = reason ?? "Run cancelled by request";
      run.finishedAt = new Date().toISOString();
      await this.runStore.set(run);
      await this.clearSessionActiveRun(run);
    }
    return run;
  }

  /**
   * 必须获取 run
   *
   * 功能说明：
   * * run 不存在时抛统一异常
   *
   * @param runId run ID
   * @returns run 实体
   *
   * @throws RuntimeError 当 run 不存在
   */
  private async mustGetRun(runId: string): Promise<Run> {
    const run = await this.runStore.get(runId);
    if (!run) {
      throw createRuntimeError(ERROR_CODES.RUN_NOT_FOUND, "Run not found", {
        runId,
      });
    }
    return run;
  }

  /**
   * 清理会话 activeRunId
   *
   * 功能说明：
   * * 在 run 终态后释放会话占用
   *
   * @param run 运行对象
   * @returns void
   */
  private async clearSessionActiveRun(run: Run): Promise<void> {
    const session = await this.sessionStore.get(run.sessionId);
    if (!session) {
      return;
    }
    if (session.activeRunId === run.runId) {
      session.activeRunId = undefined;
      session.updatedAt = new Date().toISOString();
      await this.sessionStore.set(session);
    }
  }
}

