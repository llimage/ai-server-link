/**
 * Embedding Core - Provider 抽象
 *
 * 所属模块：
 * * embedding-core
 *
 * 文件作用：
 * * 定义 embedding provider 的统一调用接口
 * * 约束输出向量的维度与可复现行为
 *
 * 主要功能：
 * * EmbeddingProvider 接口
 * * EmbeddingRequest/EmbeddingResult 类型
 *
 * 依赖：
 * * shared-types（基础类型）
 *
 * 注意事项：
 * * provider 只负责生成向量，不包含任何业务语义
 */

/**
 * embedding 请求参数
 */
export interface EmbeddingRequest {
  texts: string[];
  dimension: number;
  providerName?: string;
}

/**
 * embedding 响应
 */
export interface EmbeddingResult {
  vectors: number[][];
  dimension: number;
  providerName?: string;
}

/**
 * embedding provider 抽象
 */
export interface EmbeddingProvider {
  /**
   * 生成向量
   *
   * 功能说明：
   * * 根据文本列表生成稳定可复现的向量
   *
   * @param request embedding 请求
   * @returns embedding 结果
   */
  embed(request: EmbeddingRequest): Promise<EmbeddingResult>;
}
