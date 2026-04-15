/**
 * Tool Core 内置工具：memory.write
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 MemoryService.write 适配为可注册工具
 *
 * 主要功能：
 * * createMemoryWriteTool
 */

import type { MemoryService } from "memory-core";
import type { MemoryWriteRequest, MemoryWriteResponse } from "protocol";
import type { ToolDefinition } from "../tool-definition";

export function createMemoryWriteTool(service: MemoryService): ToolDefinition {
  return {
    name: "memory.write",
    visibility: "agent",
    sideEffect: false,
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        content: { type: "string" },
        kind: { type: "string", enum: ["note", "summary", "fact"] },
        source: { type: "string" },
        tags: { type: "array" },
      },
      required: ["userId", "content"],
    },
    outputSchema: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
        memoryId: { type: "string" },
      },
      required: ["ok", "memoryId"],
    },
    async execute(args: unknown): Promise<MemoryWriteResponse> {
      return service.write(args as MemoryWriteRequest);
    },
  };
}

