/**
 * Model Internal API 响应类型
 *
 * 所属模块：
 * * main-server/modules/model
 *
 * 文件作用：
 * * 定义 model internal API 的统一响应结构与错误码
 * * 约束 controller/service 返回格式稳定，便于 agent-runtime 解析
 *
 * 主要功能：
 * * ModelApiErrorCode
 * * ModelApiResponse
 *
 * 依赖：
 * * TypeScript 类型系统
 *
 * 注意事项：
 * * 本文件只定义 API 层语义，不承载 model-core 业务逻辑
 */

/**
 * Model internal API 错误码
 */
export const MODEL_API_ERROR_CODES = {
  INVALID_REQUEST: "INVALID_REQUEST",
  MODEL_INVOKE_FAILED: "MODEL_INVOKE_FAILED",
} as const;

/**
 * Model internal API 错误码类型
 */
export type ModelApiErrorCode =
  (typeof MODEL_API_ERROR_CODES)[keyof typeof MODEL_API_ERROR_CODES];

/**
 * Model internal API 统一响应
 */
export interface ModelApiResponse<T> {
  code: number;
  message: string;
  data: T;
  errorCode?: ModelApiErrorCode;
}

