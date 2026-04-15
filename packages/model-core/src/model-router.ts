/**
 * 模型路由器实现
 *
 * 所属模块：
 * * model-core
 *
 * 文件作用：
 * * 根据 modelId 解析可用公共模型规格
 * * 为调用编排层提供统一模型解析入口
 *
 * 主要功能：
 * * ModelRouter.resolve
 *
 * 依赖：
 * * model-catalog
 * * model-errors
 */

import { MODEL_ERROR_CODES, ModelCoreError } from "./model-errors";
import type { ModelSelectionInput, RoutingResult } from "./model-types";
import type { ModelCatalog } from "./model-catalog";

// TODO: integrate provider alias / proxy-based secure resolution in model security phase

/**
 * 模型路由器
 */
export class ModelRouter {
  constructor(private readonly catalog: ModelCatalog) {}

  /**
   * 解析模型
   *
   * 功能说明：
   * * 按 modelId 从 catalog 读取模型规格
   *
   * @param modelId 模型 ID
   * @returns 模型规格
   *
   * @throws ModelCoreError 当模型不存在时抛出 MODEL_NOT_FOUND
   */
  async resolve(input: string | ModelSelectionInput): Promise<RoutingResult> {
    const list = await this.catalog.list();
    const selection: ModelSelectionInput =
      typeof input === "string"
        ? {
            modelId: input,
          }
        : input;

    const preferredId = selection.preferredModelId ?? selection.modelId;
    if (preferredId) {
      const preferred = await this.catalog.get(preferredId);
      if (!preferred) {
        throw new ModelCoreError(
          MODEL_ERROR_CODES.MODEL_NOT_FOUND,
          `Model not found: ${preferredId}`,
        );
      }
      const fallbacks = list.filter((item) => item.modelId !== preferred.modelId);
      return {
        primary: preferred,
        fallbacks,
      };
    }

    const filtered = list.filter((item) => {
      if (selection.requiresTools && !item.supportsTools) {
        return false;
      }
      if (selection.requiresStreaming && !item.supportsStreaming) {
        return false;
      }
      if (selection.requiresJson && !item.supportsJson) {
        return false;
      }
      if (selection.latencyTier && item.latencyTier !== selection.latencyTier) {
        return false;
      }
      if (selection.priority && item.priority !== selection.priority) {
        return false;
      }
      return true;
    });

    const candidates = (filtered.length > 0 ? filtered : list).sort((a, b) => {
      const priorityScore = this.priorityToScore(b.priority) - this.priorityToScore(a.priority);
      if (priorityScore !== 0) {
        return priorityScore;
      }
      const latencyScore = this.latencyToScore(a.latencyTier) - this.latencyToScore(b.latencyTier);
      if (latencyScore !== 0) {
        return latencyScore;
      }
      return a.modelId.localeCompare(b.modelId);
    });
    const primary = candidates[0];
    if (!primary) {
      throw new ModelCoreError(
        MODEL_ERROR_CODES.MODEL_NOT_FOUND,
        "No model available",
      );
    }
    const fallbacks = list.filter((item) => item.modelId !== primary.modelId);
    return { primary, fallbacks };
  }

  /**
   * 将优先级映射为排序分数
   *
   * @param priority 优先级
   * @returns 数值分数，越大优先级越高
   */
  private priorityToScore(priority: "low" | "normal" | "high"): number {
    if (priority === "high") {
      return 3;
    }
    if (priority === "normal") {
      return 2;
    }
    return 1;
  }

  /**
   * 将延迟层映射为排序分数
   *
   * @param latency 延迟层
   * @returns 数值分数，越小表示越快
   */
  private latencyToScore(latency: "fast" | "balanced" | "slow"): number {
    if (latency === "fast") {
      return 1;
    }
    if (latency === "balanced") {
      return 2;
    }
    return 3;
  }
}
