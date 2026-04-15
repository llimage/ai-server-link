/**
 * Ingestion 切块测试
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 验证长文本切分、overlap 与短文本至少一块
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { chunkText } from "./chunker";

test("chunkText should split long text into multiple chunks", () => {
  const text = "a b c d e f g h i j k l m n o p";
  const chunks = chunkText(text, { targetTokens: 4, overlapTokens: 1 });
  assert.ok(chunks.length > 1);
});

test("chunkText should apply overlap", () => {
  const text = "a b c d e f g h";
  const chunks = chunkText(text, { targetTokens: 4, overlapTokens: 2 });
  assert.equal(chunks[0], "a b c d");
  assert.equal(chunks[1], "c d e f");
});

test("chunkText should keep short text as one chunk", () => {
  const chunks = chunkText("short text", { targetTokens: 10, overlapTokens: 2 });
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0], "short text");
});

