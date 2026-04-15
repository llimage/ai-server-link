/**
 * Tool Core 内置工具：plans.query
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 PlansService.query 适配为可注册工具
 */

import type { PlansService } from "plans-core";
import type { PlansQueryRequest, PlansQueryResponse } from "protocol";
import type { ToolDefinition } from "../tool-definition";

/**
 * 创建 plans.query 工具
 *
 * @param service plans 服务
 * @returns 工具定义
 */
export function createPlansQueryTool(service: PlansService): ToolDefinition {
  return {
    name: "plans.query",
    visibility: "agent",
    sideEffect: false,
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        space: { type: "string" },
        type: { type: "string" },
        status: { type: "string", enum: ["draft", "active", "paused", "archived"] },
        limit: { type: "number" },
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
    async execute(args: unknown): Promise<PlansQueryResponse> {
      return service.query(args as PlansQueryRequest);
    },
  };
}

