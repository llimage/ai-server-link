/**
 * 对象存储配置读取器
 *
 * 所属模块：
 * * main-server/config
 *
 * 文件作用：
 * * 统一读取对象存储相关配置，供 stored-files/export-jobs 能力使用
 *
 * 主要功能：
 * * getStorageConfig
 *
 * 依赖：
 * * process.env
 *
 * 注意事项：
 * * 本阶段仅做配置定义，不接入真实 SDK
 */

/**
 * 对象存储配置结构
 */
export interface StorageConfig {
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
}

/**
 * 读取对象存储配置
 *
 * @returns 对象存储配置
 * @throws Error 当任一关键字段缺失时抛出错误
 */
export function getStorageConfig(): StorageConfig {
  const endpoint = process.env.STORAGE_ENDPOINT;
  const bucket = process.env.STORAGE_BUCKET;
  const accessKey = process.env.STORAGE_ACCESS_KEY;
  const secretKey = process.env.STORAGE_SECRET_KEY;
  if (!endpoint || !bucket || !accessKey || !secretKey) {
    throw new Error(
      "STORAGE_ENDPOINT/STORAGE_BUCKET/STORAGE_ACCESS_KEY/STORAGE_SECRET_KEY are required",
    );
  }
  return { endpoint, bucket, accessKey, secretKey };
}

