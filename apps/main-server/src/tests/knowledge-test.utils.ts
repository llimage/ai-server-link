/**
 * Knowledge 测试辅助工具
 *
 * 所属模块：
 * * main-server/tests
 *
 * 文件作用：
 * * 提供上传并发布知识的测试辅助函数
 *
 * 主要功能：
 * * createPublishedKnowledge
 *
 * 依赖：
 * * FastifyInstance
 *
 * 注意事项：
 * * 仅用于测试环境，不包含业务逻辑
 */

import type { FastifyInstance } from "fastify";

/**
 * 创建并发布知识
 *
 * 功能说明：
 * 调用 ingestion admin routes 执行完整 pipeline
 *
 * @param app Fastify 实例
 * @param rawText 原始文本
 * @param tenantId 租户 ID
 * @returns sourceId 与 taskId
 */
export async function createPublishedKnowledge(
  app: FastifyInstance,
  rawText: string,
  tenantId: string,
): Promise<{ sourceId: string; taskId: string }> {
  const uploadRes = await app.inject({
    method: "POST",
    url: "/api/admin/ingestion/upload",
    payload: {
      rawText,
      metadata: { tenant_id: tenantId },
    },
  });
  if (uploadRes.statusCode !== 200) {
    throw new Error(`upload failed: ${uploadRes.statusCode}`);
  }
  const uploadBody = uploadRes.json() as { sourceId: string; taskId: string };
  const stagePayload = { sourceId: uploadBody.sourceId, taskId: uploadBody.taskId };

  await app.inject({ method: "POST", url: "/api/admin/ingestion/parse", payload: stagePayload });
  await app.inject({ method: "POST", url: "/api/admin/ingestion/chunk", payload: stagePayload });
  await app.inject({
    method: "POST",
    url: "/api/admin/ingestion/embed",
    payload: { ...stagePayload, params: { profileId: "default" } },
  });
  await app.inject({
    method: "POST",
    url: "/api/admin/ingestion/index",
    payload: stagePayload,
  });
  await app.inject({
    method: "POST",
    url: "/api/admin/ingestion/publish",
    payload: stagePayload,
  });

  return uploadBody;
}
