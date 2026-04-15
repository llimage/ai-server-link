/**
 * 模型重试策略
 *
 * 所属模块：
 * * model-core
 *
 * 文件作用：
 * * 定义模型调用重试策略接口与默认实现
 *
 * 主要功能：
 * * RetryPolicy
 * * DefaultRetryPolicy
 */

/**
 * 重试策略接口
 */
export interface RetryPolicy {
  /**
   * 判断是否应重试
   *
   * @param attempt 当前尝试次数（从 1 开始）
   * @param error 调用错误
   * @returns 是否重试
   */
  shouldRetry(attempt: number, error: unknown): boolean;
}

/**
 * 默认重试策略
 *
 * 功能说明：
 * * 在 provider 调用失败时最多重试 1 次
 */
export class DefaultRetryPolicy implements RetryPolicy {
  constructor(private readonly maxRetries = 2) {}

  /**
   * 判断是否应重试
   *
   * @param attempt 当前尝试次数（从 1 开始）
   * @returns 是否重试
   */
  shouldRetry(attempt: number): boolean {
    return attempt <= this.maxRetries;
  }
}
