/**
 * Tool Core 内置工具：user.meta.write
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 UserMetaService.write 适配为可注册工具
 *
 * 主要功能：
 * * createUserMetaWriteTool
 */

import type { UserMetaService } from "memory-core";
import type { UserMetaWriteRequest, UserMetaWriteResponse } from "protocol";
import type { ToolDefinition } from "../tool-definition";

export function createUserMetaWriteTool(service: UserMetaService): ToolDefinition {
  return {
    name: "user.meta.write",
    visibility: "agent",
    sideEffect: false,
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        items: { type: "array" },
      },
      required: ["userId", "items"],
    },
    outputSchema: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
        written: { type: "number" },
      },
      required: ["ok", "written"],
    },
    async execute(args: unknown): Promise<UserMetaWriteResponse> {
      return service.write(args as UserMetaWriteRequest);
    },
  };
}

