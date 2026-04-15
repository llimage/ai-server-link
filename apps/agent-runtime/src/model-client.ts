/**
 * Agent Runtime 模型客户端
 *
 * 所属模块：
 * * agent-runtime
 *
 * 文件作用：
 * * 通过 main-server 内部接口调用模型目录与模型推理
 * * 保持 agent-runtime 对 provider 实现完全无感知
 *
 * 主要功能：
 * * fetchModelCatalog
 * * invokeModel
 *
 * 依赖：
 * * protocol model 协议
 *
 * 注意事项：
 * * 只能通过 HTTP 请求 main-server，不能直接 import model-core
 */

import type { ModelCatalogItem, ModelInvokeRequest, ModelInvokeResponse } from "protocol";
import { RuntimeModelClient } from "./model-client/model-client";

/**
 * 模型客户端
 */
export class ModelClient {
  private readonly runtimeClient: RuntimeModelClient;

  constructor(mainServerBaseUrl: string) {
    this.runtimeClient = new RuntimeModelClient(mainServerBaseUrl);
  }

  /**
   * 获取公共模型目录
   *
   * @returns 模型目录列表
   */
  async fetchModelCatalog(): Promise<ModelCatalogItem[]> {
    return this.runtimeClient.fetchModelCatalog();
  }

  /**
   * 调用模型
   *
   * @param req 调用请求
   * @returns 调用响应
   */
  async invokeModel(req: ModelInvokeRequest): Promise<ModelInvokeResponse> {
    return this.runtimeClient.invoke(req);
  }

  /**
   * 流式模型调用
   *
   * @param req 调用请求
   * @returns 调用响应
   */
  async streamInvokeModel(req: ModelInvokeRequest): Promise<ModelInvokeResponse> {
    return this.runtimeClient.streamInvoke(req);
  }
}
