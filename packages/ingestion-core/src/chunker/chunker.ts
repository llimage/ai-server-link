/**
 * Ingestion Core 文本切块器
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 将解析后的文本按朴素 token 规则切分为 chunks
 *
 * 主要功能：
 * * chunkText
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 当前为朴素算法，仅用于最小闭环验证
 */

/**
 * 切分文本为 chunks
 *
 * @param text 原始文本
 * @param options 切分选项
 * @returns chunk 列表
 */
export function chunkText(
  text: string,
  options: { targetTokens: number; overlapTokens: number },
): string[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const target = Math.max(1, Math.floor(options.targetTokens));
  const overlap = Math.max(0, Math.min(Math.floor(options.overlapTokens), target - 1));
  const tokens = trimmed.split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length <= target) {
    return [tokens.join(" ")];
  }

  const step = Math.max(1, target - overlap);
  const chunks: string[] = [];
  for (let index = 0; index < tokens.length; index += step) {
    const piece = tokens.slice(index, index + target).join(" ").trim();
    if (piece) {
      chunks.push(piece);
    }
    if (index + target >= tokens.length) {
      break;
    }
  }

  if (!chunks.length) {
    return [trimmed];
  }

  // TODO: replace naive chunking with deployment-profile-aware semantic chunking
  return chunks;
}

