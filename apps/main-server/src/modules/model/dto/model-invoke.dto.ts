/**
 * Model 调用 DTO 校验器
 *
 * 所属模块：
 * * main-server/modules/model
 *
 * 文件作用：
 * * 对 /internal/model/invoke 与 /internal/model/invoke/stream 请求体做最小校验
 * * 输出可读错误信息，避免不稳定 payload 进入 model-core
 *
 * 主要功能：
 * * validateModelInvokeBody
 *
 * 依赖：
 * * protocol 类型
 *
 * 注意事项：
 * * 仅做最小必填和类型校验，不在这里做选模策略逻辑
 */

import type { ModelInvokeRequest } from "protocol";

/**
 * DTO 校验结果
 */
export type ModelInvokeBodyValidationResult =
  | { valid: true; value: ModelInvokeRequest }
  | { valid: false; message: string };

/**
 * 校验模型调用请求体
 *
 * 功能说明：
 * * 校验 runId/sessionId/userId/messages 等关键字段
 * * 对 stream/timeoutMs 做基础类型校验
 *
 * @param body 原始请求体
 * @returns 校验结果，成功返回强类型请求对象，失败返回错误信息
 */
export function validateModelInvokeBody(
  body: unknown,
): ModelInvokeBodyValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, message: "payload must be an object" };
  }

  const value = body as Partial<ModelInvokeRequest>;
  if (!value.runId || typeof value.runId !== "string") {
    return { valid: false, message: "runId is required" };
  }
  if (!value.sessionId || typeof value.sessionId !== "string") {
    return { valid: false, message: "sessionId is required" };
  }
  if (!value.userId || typeof value.userId !== "string") {
    return { valid: false, message: "userId is required" };
  }
  if (!Array.isArray(value.messages) || value.messages.length === 0) {
    return { valid: false, message: "messages must be a non-empty array" };
  }
  if (
    value.messages.some(
      (item) =>
        !item ||
        typeof item !== "object" ||
        typeof item.role !== "string" ||
        typeof item.content !== "string",
    )
  ) {
    return { valid: false, message: "messages[] contains invalid item" };
  }
  if (typeof value.stream !== "undefined" && typeof value.stream !== "boolean") {
    return { valid: false, message: "stream must be boolean" };
  }
  if (
    typeof value.timeoutMs !== "undefined" &&
    (typeof value.timeoutMs !== "number" || value.timeoutMs <= 0)
  ) {
    return { valid: false, message: "timeoutMs must be positive number" };
  }

  return {
    valid: true,
    value: value as ModelInvokeRequest,
  };
}

