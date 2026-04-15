/**
 * Tool Core 内置工具：memory.summarize
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 SummaryService.summarize 适配为可注册工具
 *
 * 主要功能：
 * * createMemorySummarizeTool
 */

import type { SummaryService } from "memory-core";
import type {
  MemorySummarizeRequest,
  MemorySummarizeResponse,
} from "protocol";
import type { ToolDefinition } from "../tool-definition";

export function createMemorySummarizeTool(
  service: SummaryService,
): ToolDefinition {
  return {
    name: "memory.summarize",
    visibility: "agent",
    sideEffect: false,
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["userId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
      },
      required: ["summary"],
    },
    async execute(args: unknown): Promise<MemorySummarizeResponse> {
      return service.summarize(args as MemorySummarizeRequest);
    },
  };
}

