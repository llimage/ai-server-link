/**
 * Ingestion 路由烟雾测试
 *
 * 所属模块：
 * * main-server
 *
 * 文件作用：
 * * 验证 ingestion 六个管理路由的最小闭环可用
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMainServer } from "./app";
import { hasDatabaseUrl, withPrisma } from "./tests/persistence-test.utils";

test("ingestion admin routes should run full pipeline", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is not configured");
    return;
  }
  const { app } = buildMainServer();
  try {
    const uploadRes = await app.inject({
      method: "POST",
      url: "/api/admin/ingestion/upload",
      payload: {
        rawText: "ingestion route smoke test text",
        metadata: { tenant_id: "demo" },
      },
    });
    assert.equal(uploadRes.statusCode, 200);
    const uploadBody = uploadRes.json() as {
      sourceId: string;
      taskId: string;
      status: string;
    };
    assert.equal(uploadBody.status, "uploaded");

    const stagePayload = { sourceId: uploadBody.sourceId, taskId: uploadBody.taskId };

    const parseRes = await app.inject({
      method: "POST",
      url: "/api/admin/ingestion/parse",
      payload: stagePayload,
    });
    assert.equal(parseRes.statusCode, 200);
    assert.equal((parseRes.json() as { status: string }).status, "parsed");

    const chunkRes = await app.inject({
      method: "POST",
      url: "/api/admin/ingestion/chunk",
      payload: stagePayload,
    });
    assert.equal(chunkRes.statusCode, 200);
    assert.equal((chunkRes.json() as { status: string }).status, "chunked");

    const embedRes = await app.inject({
      method: "POST",
      url: "/api/admin/ingestion/embed",
      payload: { ...stagePayload, params: { profileId: "default" } },
    });
    assert.equal(embedRes.statusCode, 200);
    assert.equal((embedRes.json() as { status: string }).status, "embedded");

    const indexRes = await app.inject({
      method: "POST",
      url: "/api/admin/ingestion/index",
      payload: stagePayload,
    });
    assert.equal(indexRes.statusCode, 200);
    const indexBody = indexRes.json() as { status: string };
    assert.equal(indexBody.status, "indexed");

    const publishRes = await app.inject({
      method: "POST",
      url: "/api/admin/ingestion/publish",
      payload: stagePayload,
    });
    assert.equal(publishRes.statusCode, 200);
    assert.equal((publishRes.json() as { status: string }).status, "published");

    await withPrisma(async (prisma) => {
      const source = await prisma.knowledgeSource.findUnique({
        where: { id: uploadBody.sourceId },
      });
      assert.ok(source);
      assert.equal(source?.status, "published");
      const documents = await prisma.knowledgeDocument.findMany({
        where: { sourceId: uploadBody.sourceId },
      });
      assert.ok(documents.length >= 1);
      const chunks = await prisma.knowledgeChunk.findMany({
        where: { documentId: documents[0]?.id },
      });
      assert.ok(chunks.length >= 1);
    });
  } finally {
    await app.close();
  }
});
