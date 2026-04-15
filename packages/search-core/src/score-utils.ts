/**
 * Search Core 分数工具函数
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 统一分数裁剪与归一化，保证最终得分区间稳定
 *
 * 主要功能：
 * * clampScore
 * * normalizeScore
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 所有合并前后分数都应落在 0~1 区间
 */

/**
 * 裁剪分数到 0~1
 *
 * 功能说明：
 * * 对输入分数执行下限和上限裁剪
 *
 * @param score 原始分数
 * @returns 裁剪后的分数
 */
export function clampScore(score: number): number {
  if (Number.isNaN(score)) {
    return 0;
  }
  if (score < 0) {
    return 0;
  }
  if (score > 1) {
    return 1;
  }
  return score;
}

/**
 * 归一化分数
 *
 * 功能说明：
 * * 将任意区间分数映射到 0~1
 *
 * @param score 原始分数
 * @param min 最小值
 * @param max 最大值
 * @returns 归一化后的分数
 */
export function normalizeScore(
  score: number,
  min = 0,
  max = 1,
): number {
  if (max <= min) {
    return clampScore(score);
  }
  const normalized = (score - min) / (max - min);
  return clampScore(normalized);
}

