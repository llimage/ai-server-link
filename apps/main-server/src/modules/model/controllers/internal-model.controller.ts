/**
 * Model Internal 控制器
 *
 * 所属模块：
 * * main-server/modules/model
 *
 * 文件作用：
 * * 处理 internal model API 请求并返回统一结构响应
 *
 * 主要功能：
 * * handleCatalog
 * * handleInvoke
 * * handleStreamInvoke
 *
 * 依赖：
 * * fastify
 * * dto 校验器
 * * model-handler service
 * * model-api types
 *
 * 注意事项：
 * * 控制器不直接依赖 model-core，统一走 service
 */

import type { FastifyReply, FastifyRequest } from "fastify";
import { ModelCoreError } from "model-core";
import { validateModelInvokeBody } from "../dto/model-invoke.dto";
import { ModelHandlerService } from "../services/model-handler.service";
import { MODEL_API_ERROR_CODES, type ModelApiResponse } from "../types/model-api.types";

/**
 * Internal model 控制器
 */
export class InternalModelController {
  constructor(private readonly service: ModelHandlerService) {}

  /**
   * 获取模型目录
   *
   * @returns 统一响应结构
   */
  async handleCatalog(): Promise<ModelApiResponse<{ items: unknown[] }>> {
    const items = await this.service.listModels();
    return {
      code: 0,
      message: "ok",
      data: {
        items,
      },
    };
  }

  /**
   * 执行非流式调用
   *
   * @param request Fastify 请求
   * @param reply Fastify 响应
   * @returns 统一响应结构
   */
  async handleInvoke(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<unknown> {
    const validated = validateModelInvokeBody(request.body as unknown);
    if (!validated.valid) {
      return reply.code(400).send({
        code: 400,
        message: validated.message,
        data: null,
        errorCode: MODEL_API_ERROR_CODES.INVALID_REQUEST,
      });
    }

    try {
      const data = await this.service.invoke(validated.value);
      return {
        code: 0,
        message: "ok",
        data,
      };
    } catch (error) {
      return this.formatError(reply, error);
    }
  }

  /**
   * 执行流式调用
   *
   * @param request Fastify 请求
   * @param reply Fastify 响应
   * @returns 统一响应结构
   */
  async handleStreamInvoke(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<unknown> {
    const validated = validateModelInvokeBody(request.body as unknown);
    if (!validated.valid) {
      return reply.code(400).send({
        code: 400,
        message: validated.message,
        data: null,
        errorCode: MODEL_API_ERROR_CODES.INVALID_REQUEST,
      });
    }

    try {
      const data = await this.service.streamInvoke(validated.value);
      return {
        code: 0,
        message: "ok",
        data,
      };
    } catch (error) {
      return this.formatError(reply, error);
    }
  }

  /**
   * 格式化错误响应
   *
   * @param reply Fastify 响应
   * @param error 原始错误
   * @returns 统一错误响应
   */
  private formatError(
    reply: FastifyReply,
    error: unknown,
  ): unknown {
    if (error instanceof ModelCoreError) {
      return reply.code(400).send({
        code: 400,
        message: error.message,
        data: null,
        errorCode: MODEL_API_ERROR_CODES.MODEL_INVOKE_FAILED,
      });
    }
    return reply.code(500).send({
      code: 500,
      message: error instanceof Error ? error.message : "internal error",
      data: null,
      errorCode: MODEL_API_ERROR_CODES.MODEL_INVOKE_FAILED,
    });
  }
}
