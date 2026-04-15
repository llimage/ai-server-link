/**
 * Tool Core 内置工具：records.query
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 RecordsService.query 适配为可注册工具
 */

import type { RecordsService } from "records-core";
import type { RecordsQueryRequest, RecordsQueryResponse } from "protocol";
import type { ToolDefinition } from "../tool-definition";

/**
 * 创建 records.query 工具
 *
 * @param service records 服务
 * @returns 工具定义
 */
export function createRecordsQueryTool(service: RecordsService): ToolDefinition {
  return {
    name: "records.query",
    visibility: "agent",
    sideEffect: false,
    inputSchema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        space: { type: "string" },
        type: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
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
    async execute(args: unknown): Promise<RecordsQueryResponse> {
      return service.query(args as RecordsQueryRequest);
    },
  };
}

