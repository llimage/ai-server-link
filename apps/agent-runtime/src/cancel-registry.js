"use strict";
/**
 * Runtime Core Agent 取消注册表
 *
 * 所属模块：
 * * agent-runtime
 *
 * 文件作用：
 * * 记录 run 的取消状态，供 agent-loop 轮询检查
 *
 * 主要功能：
 * * markCancelled
 * * isCancelled
 * * clear
 *
 * 依赖：
 * * 无外部依赖
 *
 * 注意事项：
 * * 当前为内存版，进程重启后状态会丢失
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelRegistry = void 0;
/**
 * 取消状态注册表
 *
 * 功能说明：
 * * 提供 run 级别取消状态读写能力
 */
class CancelRegistry {
    constructor() {
        this.cancelledRuns = new Set();
    }
    /**
     * 标记取消
     *
     * 功能说明：
     * * 将 runId 标记为已取消
     *
     * @param runId 运行 ID
     * @returns void
     */
    markCancelled(runId) {
        this.cancelledRuns.add(runId);
    }
    /**
     * 判断是否已取消
     *
     * 功能说明：
     * * 查询 run 当前是否处于取消标记状态
     *
     * @param runId 运行 ID
     * @returns 是否已取消
     */
    isCancelled(runId) {
        return this.cancelledRuns.has(runId);
    }
    /**
     * 清理取消标记
     *
     * 功能说明：
     * * 在 run 结束后移除取消状态
     *
     * @param runId 运行 ID
     * @returns void
     */
    clear(runId) {
        this.cancelledRuns.delete(runId);
    }
}
exports.CancelRegistry = CancelRegistry;
