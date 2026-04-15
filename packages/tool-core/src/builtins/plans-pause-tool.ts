/**
 * Tool Core 内置工具：plans.pause
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 PlansService.pause 适配为可注册工具
 */

import type { PlansService } from "plans-core";
import type { PlansPauseRequest } from "protocol";
import type { ToolDefinition } from "../tool-definition";

/**
 * 创建 plans.pause 工具
 *
 * @param service plans 服务
 * @returns 工具定义
 */
export function createPlansPauseTool(service: PlansService): ToolDefinition {
  return {
    name: "plans.pause",
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
      return service.pause(args as PlansPauseRequest);
    },
  };
}

