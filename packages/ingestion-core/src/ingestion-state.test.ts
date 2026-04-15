/**
 * Ingestion 状态机测试
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 验证合法/非法状态流转规则
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { assertValidIngestionTransition, isTerminalIngestionStage } from "./ingestion-state";

test("ingestion transition should allow forward progression", () => {
  assert.doesNotThrow(() => assertValidIngestionTransition("uploaded", "parsed"));
  assert.doesNotThrow(() => assertValidIngestionTransition("parsed", "chunked"));
  assert.doesNotThrow(() => assertValidIngestionTransition("indexed", "published"));
});

test("ingestion transition should reject invalid jump", () => {
  assert.throws(() => assertValidIngestionTransition("uploaded", "embedded"));
  assert.throws(() => assertValidIngestionTransition("parsed", "indexed"));
  assert.throws(() => assertValidIngestionTransition("published", "parsed"));
});

test("failed and published should be terminal", () => {
  assert.equal(isTerminalIngestionStage("failed"), true);
  assert.equal(isTerminalIngestionStage("published"), true);
  assert.equal(isTerminalIngestionStage("parsed"), false);
});

