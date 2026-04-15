/**
 * Records Core 服务测试
 *
 * 所属模块：
 * * records-core
 *
 * 文件作用：
 * * 验证 records.write/query/update 的最小闭环能力
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { InMemoryRecordsStore } from "./records-store";
import { RecordsService } from "./records-service";

/**
 * 验证 records 写入与查询
 */
test("RecordsService should write and query records", async () => {
  const service = new RecordsService(new InMemoryRecordsStore());
  const write = await service.write({
    userId: "u_rec",
    space: "general",
    type: "note",
    payload: { mood: "good" },
    tags: ["daily"],
  });
  assert.equal(write.ok, true);
  assert.ok(write.recordId.startsWith("rec_"));

  const queried = await service.query({
    userId: "u_rec",
    space: "general",
    type: "note",
  });
  assert.equal(queried.items.length, 1);
  assert.equal(queried.items[0]?.payload["mood"], "good");
});

/**
 * 验证 records 更新
 */
test("RecordsService should update record payload and tags", async () => {
  const service = new RecordsService(new InMemoryRecordsStore());
  const write = await service.write({
    userId: "u_rec",
    space: "general",
    type: "note",
    payload: { mood: "good" },
    tags: ["daily"],
  });

  const update = await service.update({
    recordId: write.recordId,
    payload: { mood: "great" },
    tags: ["daily", "updated"],
  });
  assert.equal(update.ok, true);

  const queried = await service.query({
    userId: "u_rec",
    type: "note",
    limit: 10,
  });
  assert.equal(queried.items[0]?.payload["mood"], "great");
  assert.deepEqual(queried.items[0]?.tags, ["daily", "updated"]);
});

