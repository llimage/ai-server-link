/**
 * Records Core 服务编排
 *
 * 所属模块：
 * * records-core
 *
 * 文件作用：
 * * 编排 records.write/query/update 的业务规则
 * * 负责请求校验、ID 生成、时间戳处理
 *
 * 主要功能：
 * * write
 * * query
 * * update
 *
 * 依赖：
 * * records-types
 * * protocol records 协议
 *
 * 注意事项：
 * * 保持通用记录语义，不引入行业字段判断
 */

import { randomUUID } from "node:crypto";
import type {
  RecordItem,
  RecordsQueryRequest,
  RecordsQueryResponse,
  RecordsUpdateRequest,
  RecordsUpdateResponse,
  RecordsWriteRequest,
  RecordsWriteResponse,
} from "protocol";
import type { RecordsStore } from "./records-types";

/**
 * Records 服务
 *
 * 功能：
 * * 写入记录
 * * 查询记录
 * * 更新记录
 */
export class RecordsService {
  /**
   * 构造 records 服务
   *
   * @param store 记录存储
   */
  constructor(private readonly store: RecordsStore) {}

  /**
   * 写入记录
   *
   * 功能说明：
   * * 校验 space/type/payload
   * * 创建 recordId 与时间戳
   * * 持久到 store
   *
   * @param req 写入请求
   * @returns 写入响应
   *
   * @throws Error 当 space/type 为空或 payload 为空对象时抛出
   */
  async write(req: RecordsWriteRequest): Promise<RecordsWriteResponse> {
    const space = req.space.trim();
    const type = req.type.trim();
    if (!space) {
      throw new Error("Record space cannot be empty");
    }
    if (!type) {
      throw new Error("Record type cannot be empty");
    }
    if (!req.payload || Object.keys(req.payload).length === 0) {
      throw new Error("Record payload cannot be empty");
    }

    const now = new Date().toISOString();
    const item: RecordItem = {
      recordId: `rec_${randomUUID()}`,
      userId: req.userId,
      space,
      type,
      payload: req.payload,
      tags: req.tags,
      occurredAt: req.occurredAt ?? now,
      createdAt: now,
      updatedAt: now,
    };
    await this.store.write(item);
    return {
      ok: true,
      recordId: item.recordId,
    };
  }

  /**
   * 查询记录
   *
   * 功能说明：
   * * 按 user/space/type/tags 过滤
   * * 返回按更新时间倒序结果
   *
   * @param req 查询请求
   * @returns 查询响应
   */
  async query(req: RecordsQueryRequest): Promise<RecordsQueryResponse> {
    const items = await this.store.query(req);
    return { items };
  }

  /**
   * 更新记录
   *
   * 功能说明：
   * * 仅允许更新 payload/tags
   * * 自动刷新 updatedAt
   *
   * @param req 更新请求
   * @returns 更新响应
   *
   * @throws Error 当记录不存在时抛出
   */
  async update(req: RecordsUpdateRequest): Promise<RecordsUpdateResponse> {
    const existing = await this.store.get(req.recordId);
    if (!existing) {
      throw new Error("Record not found");
    }

    const now = new Date().toISOString();
    const updated = await this.store.update(req.recordId, {
      payload: req.payload ?? existing.payload,
      tags: req.tags ?? existing.tags,
      updatedAt: now,
    });
    if (!updated) {
      throw new Error("Record not found");
    }
    return {
      ok: true,
      recordId: req.recordId,
    };
  }
}

