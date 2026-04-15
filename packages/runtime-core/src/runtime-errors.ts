/**
 * Runtime Core 错误定义
 *
 * 所属模块：
 * * runtime-core
 *
 * 文件作用：
 * * 提供运行时统一错误对象
 *
 * 主要功能：
 * * 定义 RuntimeError 类
 * * 提供 createRuntimeError 工厂方法
 *
 * 依赖：
 * * protocol/error-codes
 *
 * 注意事项：
 * * details 用于诊断，不应暴露敏感信息
 */

/**
 * 运行时统一错误类
 */
export class RuntimeError extends Error {
  code: string;
  details?: unknown;

  /**
   * 构造运行时错误
   *
   * 功能说明：
   * * 绑定错误码、错误信息与扩展上下文
   *
   * @param code 错误码
   * @param message 错误信息
   * @param details 额外上下文
   */
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "RuntimeError";
    this.code = code;
    this.details = details;
  }
}

/**
 * 创建运行时错误对象
 *
 * 功能说明：
 * * 统一创建 RuntimeError，减少重复构造代码
 *
 * @param code 错误码
 * @param message 错误信息
 * @param details 额外上下文
 * @returns RuntimeError 实例
 */
export function createRuntimeError(
  code: string,
  message: string,
  details?: unknown,
): RuntimeError {
  return new RuntimeError(code, message, details);
}
