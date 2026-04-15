/**
 * Memory Core 用户元数据类型
 *
 * 所属模块：
 * * memory-core
 *
 * 文件作用：
 * * 定义 user metadata 记录与存储接口
 *
 * 主要功能：
 * * UserMetaRecord
 * * UserMetaStore
 *
 * 依赖：
 * * protocol
 *
 * 注意事项：
 * * 仅定义通用元数据结构，不带业务字段
 */

import type { UserMetaItem } from "protocol";

export type UserMetaRecord = UserMetaItem;

export interface UserMetaStore {
  writeMany(items: UserMetaItem[]): Promise<void>;
  query(params: {
    userId: string;
    keys?: string[];
    tags?: string[];
  }): Promise<UserMetaItem[]>;
}

