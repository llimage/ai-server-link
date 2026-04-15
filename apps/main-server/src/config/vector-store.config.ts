/**
 * 向量存储配置读取器
 *
 * 所属模块：
 * * main-server/config
 *
 * 文件作用：
 * * 统一读取 LanceDB 向量存储配置
 * * 为 vector-store 适配器提供稳定默认值
 *
 * 主要功能：
 * * getVectorStoreConfig
 *
 * 依赖：
 * * process.env
 * * node:path
 *
 * 注意事项：
 * * 默认使用本地 storage/lancedb 目录
 */

import { join } from "node:path";

/**
 * 向量存储配置
 */
export interface VectorStoreConfig {
  uri: string;
  tableName: string;
}

/**
 * 读取向量存储配置
 *
 * @returns 向量存储配置
 */
export function getVectorStoreConfig(): VectorStoreConfig {
  const uri =
    process.env.LANCEDB_URI ?? join(process.cwd(), "storage", "lancedb");
  const tableName = process.env.LANCEDB_TABLE ?? "knowledge_chunks";
  return { uri, tableName };
}
