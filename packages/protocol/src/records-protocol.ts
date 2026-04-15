/**
 * Records 协议定义
 *
 * 所属模块：
 * * protocol
 *
 * 文件作用：
 * * 定义 records.write / records.query / records.update 的请求与响应协议
 * * 为 main-server、tool-core、agent-runtime 提供统一类型约束
 *
 * 主要功能：
 * * 定义记录写入请求与返回
 * * 定义记录查询请求与返回
 * * 定义记录更新请求与返回
 *
 * 依赖：
 * * TypeScript 类型系统
 *
 * 注意事项：
 * * 本协议保持通用，不包含任何行业字段
 */

/**
 * 记录写入请求
 *
 * 字段说明：
 * * userId：用户标识
 * * space：记录空间
 * * type：记录类型
 * * payload：记录负载
 * * tags：可选标签
 * * occurredAt：可选发生时间
 */
export interface RecordsWriteRequest {
  userId: string;
  space: string;
  type: string;
  payload: Record<string, unknown>;
  tags?: string[];
  occurredAt?: string;
}

/**
 * 记录写入响应
 */
export interface RecordsWriteResponse {
  ok: true;
  recordId: string;
}

/**
 * 记录查询请求
 *
 * 字段说明：
 * * userId：用户标识
 * * space：可选空间过滤
 * * type：可选类型过滤
 * * tags：可选标签过滤
 * * limit：可选返回条数限制
 */
export interface RecordsQueryRequest {
  userId: string;
  space?: string;
  type?: string;
  tags?: string[];
  limit?: number;
}

/**
 * 记录条目
 */
export interface RecordItem {
  recordId: string;
  userId: string;
  space: string;
  type: string;
  payload: Record<string, unknown>;
  tags?: string[];
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 记录查询响应
 */
export interface RecordsQueryResponse {
  items: RecordItem[];
}

/**
 * 记录更新请求
 */
export interface RecordsUpdateRequest {
  recordId: string;
  payload?: Record<string, unknown>;
  tags?: string[];
}

/**
 * 记录更新响应
 */
export interface RecordsUpdateResponse {
  ok: true;
  recordId: string;
}

