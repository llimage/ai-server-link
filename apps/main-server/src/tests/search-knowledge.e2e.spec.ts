/**
 * Search + Knowledge 真联通 E2E 测试
 *
 * 所属模块：
 * * main-server/tests
 *
 * 文件作用：
 * * 验证 ingestion 完整流程后，search.query 能检索已发布知识
 *
 * 主要功能：
 * * ingestion pipeline
 * * search.query
 * * retrieval log 落库
 *
 * 依赖：
 * * buildMainServer
 * * persistence-test.utils
 * * knowledge-test.utils
 *
 * 注意事项：
 * * 依赖真实数据库环境
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMainServer } from "../app";
import { hasDatabaseUrl, withPrisma } from "./persistence-test.utils";
import { createPublishedKnowledge } from "./knowledge-test.utils";

test("search + knowledge e2e should return published knowledge hits", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const { app } = buildMainServer();
  const tenantId = `tenant-${Date.now()}`;
  const rawText = "search e2e knowledge text hello runtime";
  try {
    const { sourceId } = await createPublishedKnowledge(app, rawText, tenantId);

    const searchRes = await app.inject({
      method: "POST",
      url: "/internal/search/query",
      payload: {
        space: "knowledge",
        query: "hello runtime",
        filters: { tenant_id: tenantId },
        topK: 5,
        mode: "keyword",
        debug: true,
      },
    });
    assert.equal(searchRes.statusCode, 200);
    const searchBody = searchRes.json() as { items?: Array<{ id: string }> };
    assert.ok((searchBody.items?.length ?? 0) >= 1);

    await withPrisma(async (prisma) => {
      const source = await prisma.knowledgeSource.findUnique({
        where: { id: sourceId },
      });
      assert.equal(source?.status, "published");
      const logs = await prisma.retrievalLog.findMany({
        where: { space: "knowledge" },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      assert.ok(logs.length >= 1);
      const latest = logs[0];
      assert.equal(latest.mode, "keyword");
      assert.ok(latest.keywordHitCount >= 0);
      assert.ok(latest.vectorHitCount >= 0);
      assert.ok(latest.mergedHitCount >= 0);
    });
  } finally {
    await app.close();
  }
});
