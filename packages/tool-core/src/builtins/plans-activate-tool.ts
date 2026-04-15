/**
 * Tool Core 内置工具：plans.activate
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 PlansService.activate 适配为可注册工具
 */

import type { PlansService } from "plans-core";
import type { PlansActivateRequest } from "protocol";
import type { ToolDefinition } from "../tool-definition";

/**
 * 创建 plans.activate 工具
 *
 * @param service plans 服务
 * @returns 工具定义
 */
export function createPlansActivateTool(service: PlansService): ToolDefinition {
  return {
    name: "plans.activate",
    visibility: "agent",
    sideEffect: true,
    inputSchema: {
      type: "object",
      properties: {
        planId: { type: "string" },
      },
      required: ["planId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
        planId: { type: "string" },
      },
      required: ["ok", "planId"],
    },
    async execute(args: unknown): Promise<{ ok: true; planId: string }> {
      return service.activate(args as PlansActivateRequest);
    },
  };
}

