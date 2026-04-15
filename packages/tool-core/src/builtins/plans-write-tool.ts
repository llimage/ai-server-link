/**
 * Tool Core 内置工具：plans.write
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 PlansService.write 适配为可注册工具
 */

import type { PlansService } from "plans-core";
import type { PlansWriteRequest, PlansWriteResponse } from "protocol";
import type { ToolDefinition } from "../tool-definition";

/**
 * 创建 plans.write 工具
 *
 * @param service plans 服务
 * @returns 工具定义
 */
export function createPlansWriteTool(service: PlansService): ToolDefinition {
  return {
    name: "plans.write",
    visibility: "agent",
    sideEffect: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        space: { type: "string" },
        type: { type: "string" },
        payload: { type: "object" },
        validFrom: { type: "string" },
        validTo: { type: "string" },
      },
      required: ["userId", "space", "type", "payload"],
    },
    outputSchema: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
        planId: { type: "string" },
      },
      required: ["ok", "planId"],
    },
    async execute(args: unknown): Promise<PlansWriteResponse> {
      return service.write(args as PlansWriteRequest);
    },
  };
}

