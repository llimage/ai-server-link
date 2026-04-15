/**
 * Search Core 主服务网关
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 封装 main-server 对 SearchService 的调用适配
 *
 * 主要功能：
 * * query
 *
 * 依赖：
 * * protocol 搜索协议
 * * search-core SearchService
 *
 * 注意事项：
 * * 本层只做转发，不实现第二套搜索逻辑
 */

import type { SearchQueryRequest, SearchQueryResponse } from "protocol";
import type { SearchService } from "search-core";

/**
 * 搜索网关
 *
 * 功能说明：
 * * 为 route 与 tool 提供统一查询入口
 */
export class SearchGateway {
  /**
   * 构造搜索网关
   *
   * @param searchService 搜索服务
   */
  constructor(private readonly searchService: SearchService) {}

  /**
   * 执行搜索
   *
   * 功能说明：
   * * 转发请求到 SearchService.query
   *
   * @param request 搜索请求
   * @returns 搜索响应
   */
  async query(request: SearchQueryRequest): Promise<SearchQueryResponse> {
    return this.searchService.query(request);
  }
}

