/**
 * Scheduler Core 运行队列定义
 *
 * 所属模块：
 * * scheduler-core
 *
 * 文件作用：
 * * 定义调度队列接口
 * * 提供 FIFO 内存队列实现
 *
 * 主要功能：
 * * enqueue
 * * dequeue
 * * remove
 * * size
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 本批次不实现优先级队列，仅使用 FIFO
 */

/**
 * 运行队列接口
 */
export interface RunQueue {
  enqueue(runId: string): Promise<void>;
  dequeue(): Promise<string | null>;
  remove(runId: string): Promise<void>;
  size(): Promise<number>;
}

/**
 * 内存版 FIFO 运行队列
 */
export class InMemoryRunQueue implements RunQueue {
  private queue: string[] = [];

  /**
   * 入队
   *
   * 功能说明：
   * * 将 runId 放入队尾
   *
   * @param runId 运行 ID
   * @returns void
   */
  async enqueue(runId: string): Promise<void> {
    this.queue.push(runId);
  }

  /**
   * 出队
   *
   * 功能说明：
   * * 从队首取出 runId
   *
   * @returns runId 或 null
   */
  async dequeue(): Promise<string | null> {
    return this.queue.shift() ?? null;
  }

  /**
   * 删除指定 run
   *
   * 功能说明：
   * * 按 runId 从队列中移除
   *
   * @param runId 运行 ID
   * @returns void
   */
  async remove(runId: string): Promise<void> {
    this.queue = this.queue.filter((item) => item !== runId);
  }

  /**
   * 获取队列大小
   *
   * 功能说明：
   * * 返回当前待调度 run 数量
   *
   * @returns 队列长度
   */
  async size(): Promise<number> {
    return this.queue.length;
  }
}
