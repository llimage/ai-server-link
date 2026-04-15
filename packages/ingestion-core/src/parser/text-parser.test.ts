/**
 * Ingestion 文本解析测试
 *
 * 所属模块：
 * * ingestion-core
 *
 * 文件作用：
 * * 验证 rawText、txt/md 读取与不支持类型报错
 */

import assert from "node:assert/strict";
import { unlink, writeFile } from "node:fs/promises";
import { test } from "node:test";
import { parseSourceToText } from "./text-parser";

test("parseSourceToText should parse rawText directly", async () => {
  const text = await parseSourceToText({
    sourceId: "s1",
    rawText: "hello ingestion",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  assert.equal(text, "hello ingestion");
});

test("parseSourceToText should read txt and md file", async () => {
  const txtPath = `${process.cwd()}\\src\\parser\\.tmp-parser.txt`;
  const mdPath = `${process.cwd()}\\src\\parser\\.tmp-parser.md`;
  try {
    await writeFile(txtPath, "txt content", "utf8");
    await writeFile(mdPath, "md content", "utf8");

    const txt = await parseSourceToText({
      sourceId: "s2",
      fileUri: txtPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const md = await parseSourceToText({
      sourceId: "s3",
      fileUri: mdPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    assert.equal(txt, "txt content");
    assert.equal(md, "md content");
  } finally {
    await unlink(txtPath).catch(() => undefined);
    await unlink(mdPath).catch(() => undefined);
  }
});

test("parseSourceToText should reject unsupported type", async () => {
  await assert.rejects(
    async () =>
      parseSourceToText({
        sourceId: "s4",
        fileUri: "D:\\ai-server\\dummy.pdf",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    /Unsupported source content/,
  );
});

