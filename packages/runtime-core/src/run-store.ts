/**
 * Runtime Core Run Store 定义
 *
 * 所属模块：
 * * runtime-core
 *
 * 文件作用：
 * * 定义 run 存储接口
 * * 提供内存版 run 存储实现
 *
 * 主要功能：
 * * get/set/delete
 * * listBySession
 *
 * 依赖：
 * * run 类型
 *
 * 注意事项：
 * * // TODO: replace in-memory store with persistent store in storage phase
 */

import type { Run } from "./run";

/**
 * Run 存储接口
 */
export interface RunStore {
  get(runId: string): Promise<Run | null>;
  set(run: Run): Promise<void>;
  delete(runId: string): Promise<void>;
  listBySession(sessionId: string): Promise<Run[]>;
}

/**
 * 内存版 Run Store
 */
export class InMemoryRunStore implements RunStore {
  // TODO: replace in-memory store with persistent store in storage phase
  private readonly store = new Map<string, Run>();

  /**
   * 读取 run
   *
   * 功能说明：
   * * 按 runId 返回运行对象
   *
   * @param runId 运行 ID
   * @returns Run 或 null
   */
  async get(runId: string): Promise<Run | null> {
    return this.store.get(runId) ?? null;
  }

  /**
   * 写入 run
   *
   * 功能说明：
   * * 覆盖保存运行对象
   *
   * @param run 运行对象
   * @returns void
   */
  async set(run: Run): Promise<void> {
    this.store.set(run.runId, run);
  }

  /**
   * 删除 run
   *
   * 功能说明：
   * * 按 runId 删除运行对象
   *
   * @param runId 运行 ID
   * @returns void
   */
  async delete(runId: string): Promise<void> {
    this.store.delete(runId);
  }

  /**
   * 按 session 查询 runs
   *
   * 功能说明：
   * * 返回指定 session 下的全部 run
   *
   * @param sessionId 会话 ID
   * @returns run 列表
   */
  async listBySession(sessionId: string): Promise<Run[]> {
    return [...this.store.values()].filter((item) => item.sessionId === sessionId);
  }
}
