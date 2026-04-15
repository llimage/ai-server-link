/**
 * Memory Core 摘要服务
 *
 * 所属模块：
 * * memory-core
 *
 * 文件作用：
 * * 提供 memory.summarize 的最小接口位实现
 *
 * 主要功能：
 * * summarize
 *
 * 依赖：
 * * protocol summary 协议
 * * memory-store
 *
 * 注意事项：
 * * 当前为 mock 摘要拼接逻辑，后续替换为模型摘要
 */

import type {
  MemorySummarizeRequest,
  MemorySummarizeResponse,
} from "protocol";
import type { MemoryStore } from "./memory-types";

export class SummaryService {
  /**
   * 构造摘要服务
   *
   * @param memoryStore 记忆存储
   */
  constructor(private readonly memoryStore: MemoryStore) {}

  /**
   * 生成记忆摘要
   *
   * @param req 摘要请求
   * @returns 摘要结果
   */
  async summarize(req: MemorySummarizeRequest): Promise<MemorySummarizeResponse> {
    const limit = Math.max(1, req.limit ?? 5);
    const items = await this.memoryStore.listByUser(req.userId);
    const top = items.slice(0, limit);
    if (!top.length) {
      return { summary: "" };
    }
    const summary = top
      .map((item, index) => `${index + 1}. ${item.content}`)
      .join(" | ")
      .slice(0, 500);
    // TODO: replace mock summarization with model-based summarization in summary phase
    return { summary };
  }
}

