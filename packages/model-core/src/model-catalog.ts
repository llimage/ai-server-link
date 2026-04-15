/**
 * 模型目录实现
 *
 * 所属模块：
 * * model-core
 *
 * 文件作用：
 * * 提供 public model catalog 的抽象与内存实现
 *
 * 主要功能：
 * * ModelCatalog 接口
 * * InMemoryModelCatalog
 *
 * 依赖：
 * * model-types
 *
 * 注意事项：
 * * 当前目录仅用于运行时骨架阶段，不持久化
 */

import type { ModelFilter, PublicModelSpec } from "./model-types";

// TODO: replace in-memory public model catalog with deployment-managed catalog

/**
 * 模型目录抽象
 */
export interface ModelCatalog {
  /**
   * 获取全部模型
   *
   * @returns 公共模型列表
   */
  list(): Promise<PublicModelSpec[]>;

  /**
   * 按 ID 获取模型
   *
   * @param modelId 模型 ID
   * @returns 模型规格或 null
   */
  get(modelId: string): Promise<PublicModelSpec | null>;

  /**
   * 按条件过滤模型
   *
   * @param filter 过滤条件
   * @returns 匹配模型列表
   */
  filter(filter: ModelFilter): Promise<PublicModelSpec[]>;
}

/**
 * 内存版模型目录
 */
export class InMemoryModelCatalog implements ModelCatalog {
  private readonly models = new Map<string, PublicModelSpec>();

  constructor(initialModels?: PublicModelSpec[]) {
    const defaults: PublicModelSpec[] = initialModels ?? [
      {
        modelId: "mock-general",
        family: "mock",
        supportsTools: true,
        supportsStreaming: true,
        supportsJson: true,
        costTier: "mid",
        latencyTier: "balanced",
        priority: "normal",
        maxContext: 64000,
        tags: ["default", "general"],
      },
      {
        modelId: "mock-fast",
        family: "mock",
        supportsTools: false,
        supportsStreaming: true,
        supportsJson: false,
        costTier: "low",
        latencyTier: "fast",
        priority: "high",
        maxContext: 32000,
        tags: ["fast", "fallback"],
      },
      {
        modelId: "mock-tools",
        family: "mock",
        supportsTools: true,
        supportsStreaming: true,
        supportsJson: true,
        costTier: "high",
        latencyTier: "slow",
        priority: "normal",
        maxContext: 128000,
        tags: ["tools"],
      },
    ];
    for (const model of defaults) {
      this.models.set(model.modelId, model);
    }
  }

  /**
   * 获取全部模型
   *
   * @returns 公共模型列表
   */
  async list(): Promise<PublicModelSpec[]> {
    return Array.from(this.models.values());
  }

  /**
   * 按 ID 获取模型
   *
   * @param modelId 模型 ID
   * @returns 模型规格或 null
   */
  async get(modelId: string): Promise<PublicModelSpec | null> {
    return this.models.get(modelId) ?? null;
  }

  /**
   * 按条件过滤模型
   *
   * @param filter 过滤条件
   * @returns 匹配模型列表
   */
  async filter(filter: ModelFilter): Promise<PublicModelSpec[]> {
    return Array.from(this.models.values()).filter((item) => {
      if (filter.family && item.family !== filter.family) {
        return false;
      }
      if (
        typeof filter.supportsTools === "boolean" &&
        item.supportsTools !== filter.supportsTools
      ) {
        return false;
      }
      if (
        typeof filter.supportsStreaming === "boolean" &&
        item.supportsStreaming !== filter.supportsStreaming
      ) {
        return false;
      }
      if (
        typeof filter.supportsJson === "boolean" &&
        item.supportsJson !== filter.supportsJson
      ) {
        return false;
      }
      if (filter.latencyTier && item.latencyTier !== filter.latencyTier) {
        return false;
      }
      if (filter.priority && item.priority !== filter.priority) {
        return false;
      }
      return true;
    });
  }
}
