/**
 * Tool Core 内置工具：memory.search
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 MemoryService.search 适配为可注册工具
 *
 * 主要功能：
 * * createMemorySearchTool
 */

import type { MemoryService } from "memory-core";
import type { MemorySearchRequest, MemorySearchResponse } from "protocol";
import type { ToolDefinition } from "../tool-definition";

export function createMemorySearchTool(service: MemoryService): ToolDefinition {
  return {
    name: "memory.search",
    visibility: "agent",
    sideEffect: false,
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        query: { type: "string" },
        topK: { type: "number" },
        tags: { type: "array" },
      },
      required: ["userId", "query"],
    },
    outputSchema: {
      type: "object",
      properties: {
        items: { type: "array" },
      },
      required: ["items"],
    },
    async execute(args: unknown): Promise<MemorySearchResponse> {
      return service.search(args as MemorySearchRequest);
    },
  };
}

