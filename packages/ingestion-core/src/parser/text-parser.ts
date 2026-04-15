/**
 * Ingestion Core 文本解析器
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 将知识源记录解析为纯文本，供后续 chunk/embed 使用
 *
 * 主要功能：
 * * parseSourceToText
 *
 * 依赖：
 * * node:fs/promises
 * * node:path
 * * ingestion-types
 *
 * 注意事项：
 * * 当前仅支持 rawText 与 txt/md 简单读取
 */

import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import type { KnowledgeSourceRecord } from "../ingestion-types";

/**
 * 文本解析器接口
 */
export interface TextParser {
  parse(record: KnowledgeSourceRecord): Promise<string>;
}

/**
 * 默认文本解析器
 */
export class DefaultTextParser implements TextParser {
  /**
   * 解析 source
   *
   * @param record 知识源记录
   * @returns 文本结果
   */
  async parse(record: KnowledgeSourceRecord): Promise<string> {
    return parseSourceToText(record);
  }
}

/**
 * 将 source 解析成文本
 *
 * @param record 知识源记录
 * @returns 解析得到的文本
 *
 * @throws Error 当 source 不可解析时抛出
 */
export async function parseSourceToText(
  record: KnowledgeSourceRecord,
): Promise<string> {
  if (record.rawText && record.rawText.trim()) {
    return record.rawText;
  }

  if (record.fileUri) {
    const filePath = normalizeFileUri(record.fileUri);
    const ext = extname(filePath).toLowerCase();
    if (ext === ".txt" || ext === ".md") {
      const content = await readFile(filePath, "utf8");
      if (!content.trim()) {
        throw new Error("File content is empty");
      }
      return content;
    }
  }

  // TODO: integrate real PDF/DOCX/OCR parsing in document parsing phase
  throw new Error("Unsupported source content for current parser");
}

/**
 * 规范化 fileUri
 *
 * @param fileUri 文件 URI 或本地路径
 * @returns 可读取的本地路径
 */
function normalizeFileUri(fileUri: string): string {
  if (fileUri.startsWith("file://")) {
    return decodeURIComponent(fileUri.replace("file://", ""));
  }
  return fileUri;
}
