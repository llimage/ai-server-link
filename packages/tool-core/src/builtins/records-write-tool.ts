/**
 * Tool Core 内置工具：records.write
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 RecordsService.write 适配为可注册工具
 *
 * 主要功能：
 * * createRecordsWriteTool
 *
 * 依赖：
 * * records-core
 * * protocol records 协议
 * * tool-definition
 */

import type { RecordsService } from "records-core";
import type { RecordsWriteRequest, RecordsWriteResponse } from "protocol";
import type { ToolDefinition } from "../tool-definition";

/**
 * 创建 records.write 工具
 *
 * @param service records 服务
 * @returns 工具定义
 */
export function createRecordsWriteTool(service: RecordsService): ToolDefinition {
  return {
    name: "records.write",
    visibility: "agent",
    sideEffect: true,
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        space: { type: "string" },
        type: { type: "string" },
        payload: { type: "object" },
        tags: { type: "array", items: { type: "string" } },
        occurredAt: { type: "string" },
      },
      required: ["userId", "space", "type", "payload"],
    },
    outputSchema: {
      type: "object",
      properties: {
        ok: { type: "boolean" },
        recordId: { type: "string" },
      },
      required: ["ok", "recordId"],
    },
    async execute(args: unknown): Promise<RecordsWriteResponse> {
      return service.write(args as RecordsWriteRequest);
    },
  };
}

