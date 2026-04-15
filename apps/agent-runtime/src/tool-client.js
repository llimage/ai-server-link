"use strict";
/**
 * Runtime Core Agent 工具客户端占位实现
 *
 * 所属模块：
 * * agent-runtime
 *
 * 文件作用：
 * * 为后续 Tool System 批次预留工具调用入口与类型边界
 *
 * 主要功能：
 * * executeTool 接口壳
 *
 * 依赖：
 * * 无
 *
 * 注意事项：
 * * 当前批次不实现真实工具调用，仅保留接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolClient = void 0;
/**
 * 工具客户端
 *
 * 功能说明：
 * * 提供统一工具执行入口（当前为未实现状态）
 */
class ToolClient {
    constructor(mainServerBaseUrl) {
        this.mainServerBaseUrl = mainServerBaseUrl;
    }
    /**
     * 执行工具
     *
     * 功能说明：
     * * 预留给后续 Tool System 批次实现真实工具网关调用
     *
     * @param payload 工具执行参数
     * @returns 工具执行结果
     *
     * @throws Error 当前未实现
     */
    async executeTool(payload) {
        const response = await fetch(`${this.mainServerBaseUrl}/internal/tools/execute`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({
                name: payload.toolName,
                args: payload.args,
            }),
        });
        if (!response.ok) {
            throw new Error(`Tool execution failed with status ${response.status}`);
        }
        const body = (await response.json());
        if (!body.ok) {
            throw new Error(body.error ?? "Tool execution failed");
        }
        return body.result;
    }
}
exports.ToolClient = ToolClient;
