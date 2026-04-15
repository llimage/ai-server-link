/**
 * Agent Runtime 模型运行时服务
 *
 * 所属模块：
 * * agent-runtime/runtime
 *
 * 文件作用：
 * * 封装 agent-loop 对 model-client 的调用逻辑
 * * 提供 invoke 与 streamInvoke 两种入口，避免 agent-loop 直接处理 HTTP 细节
 *
 * 主要功能：
 * * invoke
 * * streamInvoke
 *
 * 依赖：
 * * protocol
 * * model-client
 *
 * 注意事项：
 * * 运行时服务只负责转发调用，不包含 provider 逻辑
 */

import type { ModelInvokeRequest, ModelInvokeResponse } from "protocol";
import type { ModelClient } from "../model-client";

/**
 * 模型运行时服务
 */
export class ModelRuntimeService {
  constructor(private readonly modelClient: ModelClient) {}

  /**
   * 执行非流式调用
   *
   * @param request 调用请求
   * @returns 调用响应
   */
  async invoke(request: ModelInvokeRequest): Promise<ModelInvokeResponse> {
    return this.modelClient.invokeModel(request);
  }

  /**
   * 执行流式调用
   *
   * @param request 调用请求
   * @returns 调用响应
   */
  async streamInvoke(request: ModelInvokeRequest): Promise<ModelInvokeResponse> {
    return this.modelClient.streamInvokeModel(request);
  }
}

