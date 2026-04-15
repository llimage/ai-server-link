/**
 * Ingestion Core 状态机约束
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 提供摄入阶段状态流转校验能力
 *
 * 主要功能：
 * * assertValidIngestionTransition
 * * isTerminalIngestionStage
 *
 * 依赖：
 * * ingestion-types
 *
 * 注意事项：
 * * 只允许向前推进，failed 为终态
 */

import type { IngestionStage } from "./ingestion-types";

const NEXT_STAGE_MAP: Record<IngestionStage, IngestionStage[]> = {
  uploaded: ["parsed", "failed"],
  parsed: ["chunked", "failed"],
  chunked: ["embedded", "failed"],
  embedded: ["indexed", "failed"],
  indexed: ["published", "failed"],
  published: [],
  failed: [],
};

/**
 * 校验状态流转是否合法
 *
 * @param from 当前状态
 * @param to 目标状态
 * @returns void
 *
 * @throws Error 当状态跳转非法时抛出
 */
export function assertValidIngestionTransition(
  from: IngestionStage,
  to: IngestionStage,
): void {
  if (from === to) {
    return;
  }
  if (!NEXT_STAGE_MAP[from].includes(to)) {
    throw new Error(`Invalid ingestion transition: ${from} -> ${to}`);
  }
}

/**
 * 判断是否终态
 *
 * @param stage 摄入状态
 * @returns 是否终态
 */
export function isTerminalIngestionStage(stage: IngestionStage): boolean {
  return stage === "failed" || stage === "published";
}

