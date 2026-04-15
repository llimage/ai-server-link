/**
 * Records Core 类型定义
 *
 * 所属模块：
 * * records-core
 *
 * 文件作用：
 * * 定义 records-core 内部统一类型
 * * 定义底层 records store 抽象接口
 *
 * 主要功能：
 * * RecordsStore 接口
 * * RecordItem 类型复用导出
 *
 * 依赖：
 * * protocol records 协议
 *
 * 注意事项：
 * * records-core 仅面向通用记录能力，不承载行业语义
 */

import type { RecordItem, RecordsQueryRequest } from "protocol";

/**
 * 记录存储抽象接口
 *
 * 功能说明：
 * * 提供记录写入、查询、读取、更新能力
 */
export interface RecordsStore {
  /**
   * 写入记录
   *
   * @param item 记录条目
   * @returns 无返回值
   */
  write(item: RecordItem): Promise<void>;

  /**
   * 查询记录
   *
   * @param params 查询参数
   * @returns 记录列表
   */
  query(params: RecordsQueryRequest): Promise<RecordItem[]>;

  /**
   * 按 ID 获取记录
   *
   * @param recordId 记录 ID
   * @returns 记录或 null
   */
  get(recordId: string): Promise<RecordItem | null>;

  /**
   * 按 ID 更新记录
   *
   * @param recordId 记录 ID
   * @param patch 更新字段
   * @returns 更新后的记录或 null
   */
  update(recordId: string, patch: Partial<RecordItem>): Promise<RecordItem | null>;
}

export type { RecordItem };

