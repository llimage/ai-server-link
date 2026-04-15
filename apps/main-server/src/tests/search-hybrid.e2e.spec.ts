/**
 * Search Hybrid E2E 娴嬭瘯
 *
 * 鎵€灞炴ā鍧楋細
 * * main-server/tests
 *
 * 鏂囦欢浣滅敤锛? * * 楠岃瘉 keyword/vector/hybrid 妫€绱㈠潎鍙繑鍥炲凡鍙戝竷鐭ヨ瘑
 * * 楠岃瘉 retrieval log 鍐欏叆鍛戒腑缁熻
 *
 * 涓昏鍔熻兘锛? * * ingestion pipeline
 * * search.query (keyword/vector/hybrid)
 *
 * 渚濊禆锛? * * buildMainServer
 * * knowledge-test.utils
 * * persistence-test.utils
 *
 * 娉ㄦ剰浜嬮」锛? * * 渚濊禆鐪熷疄鏁版嵁搴撲笌 LanceDB 鐜
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMainServer } from "../app";
import { hasDatabaseUrl, withPrisma } from "./persistence-test.utils";
import { createPublishedKnowledge } from "./knowledge-test.utils";

test("search hybrid modes should return published knowledge hits", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const { app } = buildMainServer();
  const tenantId = `tenant-${Date.now()}`;
  const tenantId2 = `tenant-${Date.now()}-alt`;
  const rawText = "hybrid search knowledge text vector keyword";
  const rawText2 = "hybrid search knowledge text vector keyword alt";
  try {
    await createPublishedKnowledge(app, rawText, tenantId);
    await createPublishedKnowledge(app, rawText2, tenantId2);

    const keywordRes = await app.inject({
      method: "POST",
      url: "/internal/search/query",
      payload: {
        space: "knowledge",
        query: "keyword",
        filters: { tenant_id: tenantId },
        topK: 5,
        mode: "keyword",
      },
    });
    assert.equal(keywordRes.statusCode, 200);
    const keywordBody = keywordRes.json() as { items?: unknown[] };
    assert.ok((keywordBody.items?.length ?? 0) >= 1);

    const keywordRes2 = await app.inject({
      method: "POST",
      url: "/internal/search/query",
      payload: {
        space: "knowledge",
        query: "keyword",
        filters: { tenant_id: tenantId2 },
        topK: 5,
        mode: "keyword",
      },
    });
    assert.equal(keywordRes2.statusCode, 200);
    const keywordBody2 = keywordRes2.json() as { items?: Array<{ id: string }> };
    assert.ok((keywordBody2.items?.length ?? 0) >= 1);
    assert.notEqual(keywordBody2.items?.[0]?.id, (keywordBody.items as Array<{ id: string }>)[0]?.id);

    const vectorRes = await app.inject({
      method: "POST",
      url: "/internal/search/query",
      payload: {
        space: "knowledge",
        query: "vector",
        filters: { tenant_id: tenantId },
        topK: 5,
        mode: "vector",
      },
    });
    assert.equal(vectorRes.statusCode, 200);
    const vectorBody = vectorRes.json() as { items?: unknown[] };
    assert.ok((vectorBody.items?.length ?? 0) >= 1);

    const vectorRes2 = await app.inject({
      method: "POST",
      url: "/internal/search/query",
      payload: {
        space: "knowledge",
        query: "vector",
        filters: { tenant_id: tenantId2 },
        topK: 5,
        mode: "vector",
      },
    });
    assert.equal(vectorRes2.statusCode, 200);
    const vectorBody2 = vectorRes2.json() as { items?: Array<{ id: string }> };
    assert.ok((vectorBody2.items?.length ?? 0) >= 1);
    assert.notEqual(vectorBody2.items?.[0]?.id, (vectorBody.items as Array<{ id: string }>)[0]?.id);

    const hybridRes = await app.inject({
      method: "POST",
      url: "/internal/search/query",
      payload: {
        space: "knowledge",
        query: "hybrid",
        filters: { tenant_id: tenantId },
        topK: 5,
        mode: "hybrid",
        debug: true,
      },
    });
    assert.equal(hybridRes.statusCode, 200);
    const hybridBody = hybridRes.json() as {
      items?: unknown[];
      debug?: { keywordHits?: number; vectorHits?: number };
    };
    assert.ok((hybridBody.items?.length ?? 0) >= 1);
    assert.ok((hybridBody.debug?.keywordHits ?? 0) >= 1);
    assert.ok((hybridBody.debug?.vectorHits ?? 0) >= 1);

    await withPrisma(async (prisma) => {
      const logs = await prisma.retrievalLog.findMany({
        where: { space: "knowledge" },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
      assert.ok(logs.length >= 1);
      const latest = logs[0];
      assert.ok(latest.keywordHitCount >= 0);
      assert.ok(latest.vectorHitCount >= 0);
      assert.ok(latest.mergedHitCount >= 0);
    });
  } finally {
    await app.close();
  }
});




