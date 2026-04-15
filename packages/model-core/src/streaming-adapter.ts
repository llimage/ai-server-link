/**
 * 流式适配器定义
 *
 * 所属模块：
 * * model-core
 *
 * 文件作用：
 * * 约束 provider 原始返回到统一模型流式事件的转换接口
 *
 * 主要功能：
 * * StreamingAdapter
 */

import type { ModelStreamEvent } from "protocol";

/**
 * 流式适配器接口
 */
export interface StreamingAdapter<TRaw = unknown> {
  /**
   * 转换 provider 事件
   *
   * @param raw 原始事件
   * @returns 统一流式事件列表
   */
  toModelEvents(raw: TRaw): ModelStreamEvent[];
}

