/**
 * Runtime Core 状态机测试
 *
 * 所属模块：
 * * runtime-core
 *
 * 文件作用：
 * * 验证 session/run 状态迁移规则
 * * 验证终态判断函数
 *
 * 主要功能：
 * * session 状态迁移测试
 * * run 状态迁移测试
 * * terminal run 判断测试
 *
 * 依赖：
 * * node:test
 * * runtime-state-machine
 *
 * 注意事项：
 * * 该测试聚焦纯函数，不依赖外部服务
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertValidRunTransition,
  assertValidSessionTransition,
  isTerminalRunStatus,
} from "./runtime-state-machine";

/**
 * 测试 session 合法跳转
 *
 * 功能说明：
 * * active -> idle 与 idle -> active 应通过
 *
 * @returns void
 */
test("session transition should allow active<->idle", () => {
  assert.doesNotThrow(() => assertValidSessionTransition("active", "idle"));
  assert.doesNotThrow(() => assertValidSessionTransition("idle", "active"));
});

/**
 * 测试 session 非法跳转
 *
 * 功能说明：
 * * closed -> active 应抛错
 *
 * @returns void
 */
test("session transition should reject closed -> active", () => {
  assert.throws(() => assertValidSessionTransition("closed", "active"));
});

/**
 * 测试 run 合法跳转
 *
 * 功能说明：
 * * created -> queued -> dispatching -> running -> completed 应通过
 *
 * @returns void
 */
test("run transition should allow created to completed path", () => {
  assert.doesNotThrow(() => assertValidRunTransition("created", "queued"));
  assert.doesNotThrow(() => assertValidRunTransition("queued", "dispatching"));
  assert.doesNotThrow(() => assertValidRunTransition("dispatching", "running"));
  assert.doesNotThrow(() => assertValidRunTransition("running", "completed"));
});

/**
 * 测试 run 终态回退非法
 *
 * 功能说明：
 * * completed -> running 应抛错
 *
 * @returns void
 */
test("run transition should reject terminal to non-terminal", () => {
  assert.throws(() => assertValidRunTransition("completed", "running"));
});

/**
 * 测试终态判断
 *
 * 功能说明：
 * * completed 与 failed 为终态，running 非终态
 *
 * @returns void
 */
test("isTerminalRunStatus should return expected values", () => {
  assert.equal(isTerminalRunStatus("completed"), true);
  assert.equal(isTerminalRunStatus("failed"), true);
  assert.equal(isTerminalRunStatus("running"), false);
});
