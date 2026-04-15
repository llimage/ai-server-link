/**
 * 模型回退策略
 *
 * 所属模块：
 * * model-core
 *
 * 文件作用：
 * * 定义模型调用失败后的回退策略接口与默认实现
 *
 * 主要功能：
 * * FallbackPolicy
 * * DefaultFallbackPolicy
 */

// TODO: extend fallback policy with cost/latency-aware routing

/**
 * 回退策略接口
 */
export interface FallbackPolicy {
  /**
   * 获取回退模型 ID
   *
   * @param failedModelId 失败模型 ID
   * @returns 回退模型 ID 或 null
   */
  getFallbackModelId(failedModelId: string, candidates?: string[]): string | null;
}

/**
 * 默认回退策略
 *
 * 功能说明：
 * * reasoning.default 失败时回退到 reasoning.fast
 */
export class DefaultFallbackPolicy implements FallbackPolicy {
  /**
   * 获取回退模型 ID
   *
   * @param failedModelId 失败模型 ID
   * @returns 回退模型 ID 或 null
   */
  getFallbackModelId(failedModelId: string, candidates?: string[]): string | null {
    if (failedModelId === "mock-general") {
      return "mock-fast";
    }
    if (failedModelId === "mock-tools") {
      return "mock-general";
    }
    if (candidates && candidates.length > 0) {
      return candidates.find((item) => item !== failedModelId) ?? null;
    }
    return null;
  }
}
