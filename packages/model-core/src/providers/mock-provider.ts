/**
 * Mock Provider 适配器
 *
 * 所属模块：
 * * model-core
 *
 * 文件作用：
 * * 提供可测试的 mock 模型 provider 调用实现
 * * 支持流式 delta 输出与可控失败路径
 *
 * 主要功能：
 * * MockProviderAdapter.invoke
 *
 * 依赖：
 * * model-types
 * * protocol model 事件类型
 */

import type { ModelStreamEvent } from "protocol";
import type { ProviderInvokeParams, ProviderInvokeResult } from "../model-types";

// TODO: replace mock provider with real provider adapter behind secure proxy

/**
 * Provider 适配器抽象
 */
export interface ProviderAdapter {
  /**
   * 调用 provider
   *
   * @param params 调用参数
   * @returns 调用结果
   */
  invoke(params: ProviderInvokeParams): Promise<ProviderInvokeResult>;

  /**
   * 流式调用 provider
   *
   * @param params 调用参数
   * @returns 调用结果
   */
  streamInvoke(params: ProviderInvokeParams): Promise<ProviderInvokeResult>;
}

/**
 * Mock Provider 实现
 */
export class MockProviderAdapter implements ProviderAdapter {
  /**
   * 调用 mock provider
   *
   * 功能说明：
   * * 根据输入 messages 生成 fake 流式事件
   * * 当输入包含 force_fail 时抛错，触发上层重试/回退
   *
   * @param params 调用参数
   * @returns 流式结果
   *
   * @throws Error 当输入包含 force_fail 时抛出
   */
  async invoke(params: ProviderInvokeParams): Promise<ProviderInvokeResult> {
    return this.generateResult(params, false);
  }

  /**
   * 流式调用 mock provider
   *
   * @param params 调用参数
   * @returns 流式结果
   *
   * @throws Error 当输入包含 force_fail 且不是 fallback 模型时抛出
   */
  async streamInvoke(params: ProviderInvokeParams): Promise<ProviderInvokeResult> {
    return this.generateResult(params, true);
  }

  /**
   * 生成 mock 结果
   *
   * @param params 调用参数
   * @param forceStream 是否强制流式
   * @returns provider 调用结果
   */
  private async generateResult(
    params: ProviderInvokeParams,
    forceStream: boolean,
  ): Promise<ProviderInvokeResult> {
    const joined = params.messages.map((item) => item.content).join(" ");
    if (joined.includes("force_fail") && params.model.modelId !== "mock-fast") {
      throw new Error("mock provider forced failure");
    }

    const textA = `model(${params.model.modelId}) chunk #1. `;
    const textB = `model(${params.model.modelId}) chunk #2.`;
    const shouldStream = forceStream || params.stream;
    const events: ModelStreamEvent[] = shouldStream
      ? [
          { type: "delta", text: textA },
          { type: "delta", text: textB },
          {
            type: "done",
            usage: {
              promptTokens: Math.max(1, joined.length / 4),
              completionTokens: Math.max(1, (textA.length + textB.length) / 4),
              totalTokens: Math.max(1, joined.length / 4) + Math.max(1, (textA.length + textB.length) / 4),
            },
          },
        ]
      : [
          { type: "delta", text: `${textA}${textB}` },
          {
            type: "done",
            usage: {
              promptTokens: Math.max(1, joined.length / 4),
              completionTokens: Math.max(1, (textA.length + textB.length) / 4),
              totalTokens: Math.max(1, joined.length / 4) + Math.max(1, (textA.length + textB.length) / 4),
            },
          },
        ];
    const doneEvent = events.find(
      (event): event is Extract<ModelStreamEvent, { type: "done" }> =>
        event.type === "done",
    );
    return {
      events,
      usage: doneEvent?.usage,
    };
  }
}
