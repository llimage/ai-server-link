/**
 * Search Core Hybrid 合并测试
 *
 * 所属模块：
 * * search-core
 *
 * 文件作用：
 * * 验证 mergeHybridHits 的合并与排序规则
 *
 * 主要功能：
 * * 相同 id 合并
 * * 单边命中可输出
 * * 按 score 降序
 *
 * 依赖：
 * * node:test
 * * hybrid-merge
 *
 * 注意事项：
 * * 仅验证 merge 逻辑，不包含 rerank
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeHybridHits } from "./hybrid-merge";

/**
 * 测试相同 id 合并与排序
 */
test("mergeHybridHits should merge same id and sort by score desc", () => {
  const merged = mergeHybridHits(
    [
      { id: "a", score: 0.9, text: "A-kw", metadata: {} },
      { id: "b", score: 0.2, text: "B-kw", metadata: {} },
    ],
    [
      { id: "a", score: 0.5, text: "A-vec", metadata: {} },
      { id: "c", score: 0.8, text: "C-vec", metadata: {} },
    ],
    { keywordWeight: 0.5, vectorWeight: 0.5 },
  );

  assert.equal(merged.length, 3);
  assert.equal(merged[0]?.id, "a");
  assert.equal(merged[1]?.id, "b");
  assert.equal(merged[2]?.id, "c");
});

/**
 * 测试单边命中输出
 */
test("mergeHybridHits should keep single-side hits", () => {
  const merged = mergeHybridHits(
    [{ id: "only-kw", score: 0.3, text: "kw", metadata: {} }],
    [{ id: "only-vec", score: 0.7, text: "vec", metadata: {} }],
    { keywordWeight: 0.4, vectorWeight: 0.6 },
  );
  assert.equal(merged.length, 2);
  assert.ok(merged.some((item) => item.id === "only-kw"));
  assert.ok(merged.some((item) => item.id === "only-vec"));
  assert.equal(merged[0]?.id, "only-vec");
});
