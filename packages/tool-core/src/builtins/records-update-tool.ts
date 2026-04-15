/**
 * Tool Core 内置工具：records.update
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 RecordsService.update 适配为可注册工具
 */

import type { RecordsService } from "records-core";
import type { RecordsUpdateRequest, RecordsUpdateResponse } from "protocol";
import type { ToolDefinition } from "../tool-definition";

/**
 * 创建 records.update 工具
 *
 * @param service records 服务
 * @returns 工具定义
 */
export function createRecordsUpdateTool(service: RecordsService): ToolDefinition {
  return {
    name: "records.update",
    visibility: "agent",
    sideEffect: true,
    inputSchema: {
      type: "object",
      properties: {
        recordId: { type: "string" },
        payload: { type: "object" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["recordId"],
    },
    outputSchema: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
        recordId: { type: "string" },
      },
      required: ["ok", "recordId"],
    },
    async execute(args: unknown): Promise<RecordsUpdateResponse> {
      return service.update(args as RecordsUpdateRequest);
    },
  };
}

