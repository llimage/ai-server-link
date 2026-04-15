/**
 * Tool Core 内置工具：plans.expand
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 PlansService.expand 适配为可注册工具
 */

import type { PlansService } from "plans-core";
import type { PlansExpandRequest, PlansExpandResponse } from "protocol";
import type { ToolDefinition } from "../tool-definition";

/**
 * 创建 plans.expand 工具
 *
 * @param service plans 服务
 * @returns 工具定义
 */
export function createPlansExpandTool(service: PlansService): ToolDefinition {
  return {
    name: "plans.expand",
    visibility: "agent",
    sideEffect: false,
    inputSchema: {
      type: "object",
      properties: {
        planId: { type: "string" },
        date: { type: "string" },
      },
      required: ["planId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        planId: { type: "string" },
        items: { type: "array" },
      },
      required: ["planId", "items"],
    },
    async execute(args: unknown): Promise<PlansExpandResponse> {
      return service.expand(args as PlansExpandRequest);
    },
  };
}

