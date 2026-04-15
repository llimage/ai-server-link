/**
 * Model Streaming 事件适配器
 *
 * 所属模块：
 * * main-server/modules/model
 *
 * 文件作用：
 * * 规范化模型流式事件输出，保证返回格式稳定
 *
 * 主要功能：
 * * normalizeStreamEvents
 *
 * 依赖：
 * * protocol
 *
 * 注意事项：
 * * 目前采用批量 events 返回，后续可替换为 SSE/WS 桥接
 */

import type { ModelStreamEvent } from "protocol";

/**
 * 规范化流式事件
 *
 * @param events 原始事件
 * @returns 规范化事件
 */
export function normalizeStreamEvents(
  events: ModelStreamEvent[],
): ModelStreamEvent[] {
  return events.map((event) => {
    if (event.type === "delta") {
      return {
        type: "delta",
        text: event.text,
      };
    }
    if (event.type === "done") {
      return {
        type: "done",
        usage: event.usage,
      };
    }
    return {
      type: "error",
      code: event.code,
      message: event.message,
    };
  });
}

