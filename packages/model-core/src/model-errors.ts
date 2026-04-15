/**
 * 模型核心错误定义
 *
 * 所属模块：
 * * model-core
 *
 * 文件作用：
 * * 定义模型层统一错误码与错误类型
 *
 * 主要功能：
 * * MODEL_ERROR_CODES
 * * ModelCoreError
 */

/**
 * 模型错误码常量
 */
export const MODEL_ERROR_CODES = {
  MODEL_NOT_FOUND: "MODEL_NOT_FOUND",
  MODEL_TIMEOUT: "MODEL_TIMEOUT",
  MODEL_PROVIDER_FAILED: "MODEL_PROVIDER_FAILED",
  MODEL_FALLBACK_EXHAUSTED: "MODEL_FALLBACK_EXHAUSTED",
} as const;

/**
 * 模型错误码类型
 */
export type ModelErrorCode =
  (typeof MODEL_ERROR_CODES)[keyof typeof MODEL_ERROR_CODES];

/**
 * 模型核心错误
 */
export class ModelCoreError extends Error {
  constructor(
    public readonly code: ModelErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ModelCoreError";
  }
}

