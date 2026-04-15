/**
 * Embedding Core - 统一导出
 *
 * 所属模块：
 * * embedding-core
 *
 * 文件作用：
 * * 导出 embedding provider 相关类型与实现
 *
 * 主要功能：
 * * export EmbeddingProvider / DeterministicEmbeddingProvider
 *
 * 依赖：
 * * embedding-provider
 * * deterministic-embedding-provider
 *
 * 注意事项：
 * * 仅导出能力，不包含业务逻辑
 */

export type { EmbeddingProvider, EmbeddingRequest, EmbeddingResult } from "./embedding-provider";
export { DeterministicEmbeddingProvider } from "./deterministic-embedding-provider";
