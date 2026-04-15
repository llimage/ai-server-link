/**
 * Agent Runtime Model Client（目录版）
 *
 * 所属模块：
 * * agent-runtime/model-client
 *
 * 文件作用：
 * * 封装 agent-runtime 到 main-server 的模型调用客户端
 * * 强制 agent-runtime 通过 internal API 调用 model handler
 *
 * 主要功能：
 * * fetchModelCatalog
 * * invoke
 * * streamInvoke
 *
 * 依赖：
 * * protocol model 协议
 *
 * 注意事项：
 * * 不允许在 agent-runtime 直接接入 provider SDK
 */

import type {
  ModelCatalogItem,
  ModelInvokeRequest,
  ModelInvokeResponse,
} from "protocol";

/**
 * internal API 统一响应结构
 */
interface InternalApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
  errorCode?: string;
}

/**
 * 模型客户端
 */
export class RuntimeModelClient {
  constructor(private readonly mainServerBaseUrl: string) {}

  /**
   * 获取公共模型目录
   *
   * @returns 模型列表
   */
  async fetchModelCatalog(): Promise<ModelCatalogItem[]> {
    const response = await fetch(`${this.mainServerBaseUrl}/internal/models/catalog`);
    if (!response.ok) {
      throw new Error(`Model catalog fetch failed with status ${response.status}`);
    }
    const body = (await response.json()) as InternalApiEnvelope<{
      items?: ModelCatalogItem[];
    }>;
    return body.data?.items ?? [];
  }

  /**
   * 非流式模型调用
   *
   * @param request 调用请求
   * @returns 调用响应
   */
  async invoke(request: ModelInvokeRequest): Promise<ModelInvokeResponse> {
    return this.postInvoke("/internal/model/invoke", request);
  }

  /**
   * 流式模型调用
   *
   * @param request 调用请求
   * @returns 调用响应
   */
  async streamInvoke(request: ModelInvokeRequest): Promise<ModelInvokeResponse> {
    return this.postInvoke("/internal/model/invoke/stream", {
      ...request,
      stream: true,
    });
  }

  /**
   * 发送调用请求并解包统一响应
   *
   * @param path internal 路由路径
   * @param request 请求体
   * @returns 模型调用响应
   */
  private async postInvoke(
    path: string,
    request: ModelInvokeRequest,
  ): Promise<ModelInvokeResponse> {
    const response = await fetch(`${this.mainServerBaseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(request),
    });
    const body = (await response.json()) as InternalApiEnvelope<{
      modelId: string;
      events: ModelInvokeResponse["events"];
      attempts: ModelInvokeResponse["attempts"];
    }>;
    if (!response.ok || body.code !== 0) {
      throw new Error(
        `Model invoke failed: ${body.errorCode ?? "UNKNOWN"} ${body.message}`,
      );
    }
    return {
      ok: true,
      modelId: body.data.modelId,
      events: body.data.events,
      attempts: body.data.attempts,
    };
  }
}

