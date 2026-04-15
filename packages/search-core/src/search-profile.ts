/**
 * Search Core 部署配置模型
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 定义 Search Profile 结构
 * * 提供默认 profile 供本批次最小闭环使用
 *
 * 主要功能：
 * * 定义 SearchProfile 接口
 * * 提供 getDefaultSearchProfile
 *
 * 依赖：
 * * protocol SearchMode
 *
 * 注意事项：
 * * 当前批次使用固定默认配置，后续再接部署配置中心
 */

import type { SearchMode } from "protocol";

/**
 * 搜索配置模型
 */
export interface SearchProfile {
  profileId: string;
  embedding: {
    model: string;
    dimension: number;
  };
  chunk: {
    targetTokens: number;
    maxTokens: number;
    overlapTokens: number;
  };
  partition: {
    primary: string[];
    secondary?: string[];
  };
  search: {
    defaultMode: SearchMode;
    defaultTopK: number;
    vectorWeight: number;
    keywordWeight: number;
    rerankEnabled: boolean;
    rerankTopN: number;
  };
}

/**
 * 获取默认搜索配置
 *
 * 功能说明：
 * * 返回当前批次可用的默认部署参数
 *
 * @returns 默认 SearchProfile
 */
export function getDefaultSearchProfile(): SearchProfile {
  // TODO: load deployment profile from persistent configuration in deployment phase
  return {
    profileId: "default",
    embedding: {
      model: "mock-embedding-v1",
      dimension: 1536,
    },
    chunk: {
      targetTokens: 300,
      maxTokens: 500,
      overlapTokens: 50,
    },
    partition: {
      primary: ["tenant_id", "kb_id"],
      secondary: ["lang", "topic"],
    },
    search: {
      defaultMode: "hybrid",
      defaultTopK: 5,
      vectorWeight: 0.5,
      keywordWeight: 0.5,
      rerankEnabled: false,
      rerankTopN: 20,
    },
  };
}

