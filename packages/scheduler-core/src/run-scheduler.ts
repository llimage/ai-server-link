/**
 * Scheduler Core 运行调度器
 *
 * 所属模块：
 * * scheduler-core
 *
 * 文件作用：
 * * 串联 run queue、stores、调度策略和 agent gateway
 * * 实现最小 submit/dispatch/cancel/timeout 编排闭环
 *
 * 主要功能：
 * * submit
 * * dispatchNext
 * * cancel
 * * timeout
 *
 * 依赖：
 * * run-queue
 * * runtime-core stores
 * * dispatch-policy
 * * protocol error codes
 *
 * 注意事项：
 * * 调度器不直接发 websocket，不直接执行业务 tool
 */

import { ERROR_CODES } from "protocol";
import type { RunStore, SessionStore } from "runtime-core";
import { createRuntimeError, isTerminalRunStatus, type Run } from "runtime-core";
import type { DispatchPolicy } from "./dispatch-policy";
import type { RunQueue } from "./run-queue";

/**
 * Agent Gateway 最小接口
 */
export interface SchedulerAgentGateway {
  startRun(
    agentRuntimeBaseUrl: string,
    payload: {
      runId: string;
      sessionId: string;
      userId: string;
      agentId: string;
      timeoutMs: number;
      stream: boolean;
      input: {
        type: "text";
        text: string;
      };
    },
  ): Promise<{ accepted: boolean }>;
  cancelRun(
    agentRuntimeBaseUrl: string,
    payload: {
      runId: string;
      sessionId: string;
      userId: string;
      agentId: string;
      reason?: string;
    },
  ): Promise<{ accepted: boolean }>;
}

/**
 * 运行调度器
 */
export class RunScheduler {
  /**
   * 构造调度器
   *
   * 功能说明：
   * * 注入调度所需的全部依赖组件
   *
   * @param runQueue 调度队列
   * @param runStore run 存储
   * @param sessionStore session 存储
   * @param dispatchPolicy 调度策略
   * @param agentGateway agent 调用适配器
   */
  constructor(
    private readonly runQueue: RunQueue,
    private readonly runStore: RunStore,
    private readonly sessionStore: SessionStore,
    private readonly dispatchPolicy: DispatchPolicy,
    private readonly agentGateway: SchedulerAgentGateway,
  ) {}

  /**
   * 提交 run 到队列
   *
   * 功能说明：
   * * 将 run 状态标记为 queued 并入队
   *
   * @param runId 运行 ID
   * @returns void
   */
  async submit(runId: string): Promise<void> {
    const run = await this.mustGetRun(runId);
    run.status = "queued";
    await this.runStore.set(run);
    await this.runQueue.enqueue(runId);
  }

  /**
   * 调度下一个 run
   *
   * 功能说明：
   * * 从队列取 run，校验 session 与 activeRun，再选择 agent 执行
   *
   * @returns 调度成功时返回 runId，否则返回 null
   */
  async dispatchNext(): Promise<string | null> {
    const runId = await this.runQueue.dequeue();
    if (!runId) {
      return null;
    }

    const run = await this.runStore.get(runId);
    if (!run) {
      return null;
    }

    const session = await this.sessionStore.get(run.sessionId);
    if (!session) {
      run.status = "failed";
      run.errorCode = ERROR_CODES.SESSION_NOT_FOUND;
      run.errorMessage = "Session not found for run dispatch";
      run.finishedAt = new Date().toISOString();
      await this.runStore.set(run);
      return null;
    }

    if (session.activeRunId && session.activeRunId !== run.runId) {
      run.status = "failed";
      run.errorCode = ERROR_CODES.ACTIVE_RUN_EXISTS;
      run.errorMessage = "Session already has active run";
      run.finishedAt = new Date().toISOString();
      await this.runStore.set(run);
      return null;
    }

    const target = await this.dispatchPolicy.selectAgentRuntime(run.agentId);
    if (!target) {
      run.status = "failed";
      run.errorCode = ERROR_CODES.AGENT_UNAVAILABLE;
      run.errorMessage = "No available agent runtime";
      run.finishedAt = new Date().toISOString();
      await this.runStore.set(run);
      return null;
    }

    run.status = "dispatching";
    await this.runStore.set(run);

    try {
      const result = await this.agentGateway.startRun(target.baseUrl, {
        runId: run.runId,
        sessionId: run.sessionId,
        userId: run.userId,
        agentId: run.agentId,
        timeoutMs: run.timeoutMs,
        stream: true,
        input: run.input,
      });
      if (!result.accepted) {
        throw createRuntimeError(
          ERROR_CODES.RUN_DISPATCH_FAILED,
          "Agent runtime rejected run",
          { runId: run.runId },
        );
      }
      run.status = "running";
      run.startedAt = new Date().toISOString();
      await this.runStore.set(run);
      return runId;
    } catch (error) {
      run.status = "failed";
      run.errorCode = ERROR_CODES.RUN_DISPATCH_FAILED;
      run.errorMessage = error instanceof Error ? error.message : "Dispatch failed";
      run.finishedAt = new Date().toISOString();
      await this.runStore.set(run);
      return null;
    }
  }

  /**
   * 取消 run
   *
   * 功能说明：
   * * 标记 run cancelled 并清理 queue
   *
   * @param runId 运行 ID
   * @returns void
   */
  async cancel(runId: string): Promise<void> {
    const run = await this.mustGetRun(runId);
    if (isTerminalRunStatus(run.status)) {
      return;
    }
    await this.runQueue.remove(runId);
    run.status = "cancelled";
    run.errorCode = ERROR_CODES.RUN_CANCELLED;
    run.errorMessage = "Run cancelled by client";
    run.finishedAt = new Date().toISOString();
    await this.runStore.set(run);
    await this.clearSessionActiveRun(run);
  }

  /**
   * 超时处理
   *
   * 功能说明：
   * * 标记 run timeout 并清理 queue
   *
   * @param runId 运行 ID
   * @returns void
   */
  async timeout(runId: string): Promise<void> {
    const run = await this.mustGetRun(runId);
    if (isTerminalRunStatus(run.status)) {
      return;
    }
    await this.runQueue.remove(runId);
    run.status = "timeout";
    run.errorCode = ERROR_CODES.RUN_TIMEOUT;
    run.errorMessage = "Run timeout";
    run.finishedAt = new Date().toISOString();
    await this.runStore.set(run);
    await this.clearSessionActiveRun(run);
  }

  /**
   * 必须获取 run
   *
   * 功能说明：
   * * 不存在时抛 RUN_NOT_FOUND
   *
   * @param runId 运行 ID
   * @returns run 实体
   * @throws RuntimeError run 不存在时抛出
   */
  private async mustGetRun(runId: string): Promise<Run> {
    const run = await this.runStore.get(runId);
    if (!run) {
      throw createRuntimeError(ERROR_CODES.RUN_NOT_FOUND, "Run not found", { runId });
    }
    return run;
  }

  /**
   * 清理 session activeRunId
   *
   * 功能说明：
   * * 在终态时清空会话活动 run
   *
   * @param run 运行实体
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
