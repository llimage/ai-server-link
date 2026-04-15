/**
 * Search Core 查询归一化测试
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 验证 query-normalizer 的最小规范化行为
 *
 * 主要功能：
 * * trim 生效
 * * collapse spaces 生效
 * * lower-case 生效
 * * 空字符串拒绝
 *
 * 依赖：
 * * node:test
 * * query-normalizer
 *
 * 注意事项：
 * * 仅覆盖本批规定的最小行为
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeQuery } from "./query-normalizer";

/**
 * 测试 trim/collapse/lower-case
 */
test("normalizeQuery should trim collapse spaces and lowercase", () => {
  const result = normalizeQuery("  HeLLo   WoRLD  ");
  assert.equal(result.raw, "  HeLLo   WoRLD  ");
  assert.equal(result.normalized, "hello world");
});

/**
 * 测试空字符串拒绝
 */
test("normalizeQuery should reject empty normalized query", () => {
  assert.throws(() => normalizeQuery("    "), /Query cannot be empty/);
});

