/**
 * Tool Core 内置搜索工具
 *
 * 所属模块：
 * * tool-core
 *
 * 文件作用：
 * * 将 search.query 以标准 ToolDefinition 形式注册到工具系统
 *
 * 主要功能：
 * * createSearchQueryTool
 *
 * 依赖：
 * * protocol SearchQueryRequest
 * * search-core SearchService
 * * tool-definition
 *
 * 注意事项：
 * * 工具本身不承载搜索逻辑，只负责参数转发
 */

import type { SearchQueryRequest, SearchQueryResponse } from "protocol";
import type { SearchService } from "search-core";
import type { ToolDefinition } from "../tool-definition";

/**
 * 创建 search.query 工具定义
 *
 * 功能说明：
 * * 返回可注册的内置工具，执行时调用 SearchService.query
 *
 * @param searchService 搜索服务实例
 * @returns search.query 工具定义
 */
export function createSearchQueryTool(searchService: SearchService): ToolDefinition {
  return {
    name: "search.query",
    visibility: "agent",
    sideEffect: false,
    inputSchema: {
      type: "object",
      properties: {
        space: { type: "string" },
        query: { type: "string" },
        filters: { type: "object" },
        topK: { type: "number" },
        mode: { type: "string", enum: ["keyword", "vector", "hybrid"] },
      },
      required: ["space", "query"],
    },
    outputSchema: {
      type: "object",
      properties: {
        items: { type: "array" },
        debug: { type: "object" },
      },
      required: ["items"],
    },
    async execute(args: unknown): Promise<SearchQueryResponse> {
      // TODO: add stricter schema validation before search execution
      return searchService.query(args as SearchQueryRequest);
    },
  };
}

