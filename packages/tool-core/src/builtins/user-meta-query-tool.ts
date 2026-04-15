/**
 * Tool Core 内置工具：user.meta.query
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 UserMetaService.query 适配为可注册工具
 *
 * 主要功能：
 * * createUserMetaQueryTool
 */

import type { UserMetaService } from "memory-core";
import type { UserMetaQueryRequest, UserMetaQueryResponse } from "protocol";
import type { ToolDefinition } from "../tool-definition";

export function createUserMetaQueryTool(service: UserMetaService): ToolDefinition {
  return {
    name: "user.meta.query",
    visibility: "agent",
    sideEffect: false,
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        keys: { type: "array" },
        tags: { type: "array" },
      },
      required: ["userId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        items: { type: "array" },
      },
      required: ["items"],
    },
    async execute(args: unknown): Promise<UserMetaQueryResponse> {
      return service.query(args as UserMetaQueryRequest);
    },
  };
}

