/**
 * User Metadata 协议定义
 *
 * 所属模块：
 * * protocol
 *
 * 文件作用：
 * * 定义 user.meta.write / user.meta.query 请求响应结构
 *
 * 主要功能：
 * * UserMeta 写入协议
 * * UserMeta 查询协议
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 保持通用 key-value 结构，不绑定业务字段
 */

export interface UserMetaItemInput {
  key: string;
  value: unknown;
  source?: string;
  confidence?: number;
  tags?: string[];
}

export interface UserMetaWriteRequest {
  userId: string;
  items: UserMetaItemInput[];
}

export interface UserMetaWriteResponse {
  ok: true;
  written: number;
}

export interface UserMetaQueryRequest {
  userId: string;
  keys?: string[];
  tags?: string[];
}

export interface UserMetaItem {
  id: string;
  userId: string;
  key: string;
  value: unknown;
  source?: string;
  confidence?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserMetaQueryResponse {
  items: UserMetaItem[];
}

