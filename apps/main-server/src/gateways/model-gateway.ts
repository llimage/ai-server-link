/**
 * Model 主服务网关
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 封装 model-core 的目录与调用能力
 * * 为 internal model route 提供统一调用入口
 *
 * 主要功能：
 * * listModels
 * * invokeModel
 *
 * 依赖：
 * * model-core
 * * protocol model 协议
 */

import type {
  ModelCatalogItem,
  ModelInvokeRequest,
  ModelInvokeResponse,
} from "protocol";
import type { ModelCatalog, ModelInvokeService } from "model-core";

/**
 * 模型网关
 */
export class ModelGateway {
  constructor(
    private readonly catalog: ModelCatalog,
    private readonly invokeService: ModelInvokeService,
  ) {}

  /**
   * 获取模型目录
   *
   * @returns 公共模型目录
   */
  async listModels(): Promise<ModelCatalogItem[]> {
    return this.catalog.list();
  }

  /**
   * 调用模型
   *
   * @param req 调用请求
   * @returns 调用响应
   */
  async invokeModel(req: ModelInvokeRequest): Promise<ModelInvokeResponse> {
    return this.invokeService.invoke(req);
  }

  /**
   * 流式调用模型
   *
   * @param req 调用请求
   * @returns 调用响应
   */
  async streamInvokeModel(req: ModelInvokeRequest): Promise<ModelInvokeResponse> {
    return this.invokeService.streamInvoke(req);
  }
}
