/**
 * Search Core 过滤归一化测试
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 验证 filter-normalizer 的清洗与校验行为
 *
 * 主要功能：
 * * 删除 undefined
 * * 拒绝函数值
 * * 保留通用字段
 *
 * 依赖：
 * * node:test
 * * filter-normalizer
 *
 * 注意事项：
 * * 仅覆盖本批规定规则
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeFilters } from "./filter-normalizer";

/**
 * 测试 undefined 清理与通用字段保留
 */
test("normalizeFilters should remove undefined and keep generic fields", () => {
  const result = normalizeFilters({
    tenant_id: "t1",
    kb_id: "kb1",
    lang: "zh",
    topic: "general",
    ignored: undefined,
  });
  assert.deepEqual(result.values, {
    tenant_id: "t1",
    kb_id: "kb1",
    lang: "zh",
    topic: "general",
  });
});

/**
 * 测试函数值拒绝
 */
test("normalizeFilters should reject function value", () => {
  assert.throws(
    () =>
      normalizeFilters({
        tenant_id: "t1",
        bad: () => "x",
      }),
    /Invalid filter value/,
  );
});

