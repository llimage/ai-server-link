/**
 * Run 日志服务
 *
 * 所属模块：
 * * main-server/modules/runtime
 *
 * 文件作用：
 * * 统一封装 run 生命周期日志写入
 *
 * 主要功能：
 * * onRunCreated/onRunStarted/onRunStreaming/onRunCompleted/onRunFailed/onRunCanceled
 *
 * 依赖：
 * * RunRepository
 * * RunEventRepository
 */

import { RunEventRepository } from "../../../repositories/run-event.repository";
import { RunRepository } from "../../../repositories/run.repository";
import type { Prisma } from "@prisma/client";

export class RunLogService {
  constructor(
    private readonly runRepository: RunRepository,
    private readonly runEventRepository: RunEventRepository,
  ) {}

  async onRunCreated(runId: string, payload?: Record<string, unknown>): Promise<void> {
    const existing = await this.runRepository.getRunById(runId);
    if (!existing) {
      await this.runRepository.createRun({
        id: runId,
        sessionId:
          typeof payload?.sessionId === "string" ? payload.sessionId : "unknown",
        userId: typeof payload?.userId === "string" ? payload.userId : null,
        status: "created",
        inputText:
          typeof payload?.inputText === "string" ? payload.inputText : null,
        timeoutMs:
          typeof payload?.timeoutMs === "number" ? payload.timeoutMs : 30000,
        metadataJson: payload as Prisma.InputJsonValue | undefined,
      });
    }
    await this.runEventRepository.appendEvent({
      eventType: "created",
      payloadJson: payload as Prisma.InputJsonValue | undefined,
      run: { connect: { id: runId } },
    });
  }

  async onRunStarted(runId: string, payload?: Record<string, unknown>): Promise<void> {
    const existing = await this.runRepository.getRunById(runId);
    if (existing) {
      await this.runRepository.updateRunStatus(runId, "running");
    }
    await this.runEventRepository.appendEvent({
      eventType: "started",
      payloadJson: payload as Prisma.InputJsonValue | undefined,
      run: { connect: { id: runId } },
    });
  }

  async onRunStreaming(runId: string, payload?: Record<string, unknown>): Promise<void> {
    await this.runEventRepository.appendEvent({
      eventType: "streaming",
      payloadJson: payload as Prisma.InputJsonValue | undefined,
      run: { connect: { id: runId } },
    });
  }

  async onRunCompleted(runId: string, payload?: Record<string, unknown>): Promise<void> {
    const existing = await this.runRepository.getRunById(runId);
    if (existing) {
      await this.runRepository.finishRun(runId, "completed");
    }
    await this.runEventRepository.appendEvent({
      eventType: "completed",
      payloadJson: payload as Prisma.InputJsonValue | undefined,
      run: { connect: { id: runId } },
    });
  }

  async onRunFailed(runId: string, payload?: Record<string, unknown>): Promise<void> {
    const existing = await this.runRepository.getRunById(runId);
    if (existing) {
      await this.runRepository.finishRun(runId, "failed");
    }
    await this.runEventRepository.appendEvent({
      eventType: "failed",
      payloadJson: payload as Prisma.InputJsonValue | undefined,
      run: { connect: { id: runId } },
    });
  }

  async onRunCanceled(runId: string, payload?: Record<string, unknown>): Promise<void> {
    const existing = await this.runRepository.getRunById(runId);
    if (existing) {
      await this.runRepository.finishRun(runId, "canceled");
    }
    await this.runEventRepository.appendEvent({
      eventType: "canceled",
      payloadJson: payload as Prisma.InputJsonValue | undefined,
      run: { connect: { id: runId } },
    });
  }
}
