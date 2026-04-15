/**
 * Memory 协议定义
 *
 * 所属模块：
 * * protocol
 *
 * 文件作用：
 * * 定义 memory.write/search/summarize 请求响应结构
 *
 * 主要功能：
 * * Memory 写入协议
 * * Memory 搜索协议
 * * Memory 摘要协议
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * memory 为通用记忆层，不等同消息日志
 */

export interface MemoryWriteRequest {
  userId: string;
  content: string;
  kind?: "note" | "summary" | "fact";
  source?: string;
  tags?: string[];
}

export interface MemoryWriteResponse {
  ok: true;
  memoryId: string;
}

export interface MemorySearchRequest {
  userId: string;
  query: string;
  topK?: number;
  tags?: string[];
}

export interface MemoryItem {
  id: string;
  userId: string;
  content: string;
  kind: "note" | "summary" | "fact";
  source?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MemorySearchResponse {
  items: MemoryItem[];
}

export interface MemorySummarizeRequest {
  userId: string;
  limit?: number;
}

export interface MemorySummarizeResponse {
  summary: string;
}

