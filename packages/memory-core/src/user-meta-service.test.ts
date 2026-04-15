/**
 * Memory Core 用户元数据服务测试
 *
 * 所属模块：
 * * memory-core
 *
 * 文件作用：
 * * 验证 write/query 的 key 与 tags 过滤行为
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { UserMetaService } from "./user-meta-service";
import { InMemoryUserMetaStore } from "./user-meta-store";

test("UserMetaService should write and query by key/tags", async () => {
  const service = new UserMetaService(new InMemoryUserMetaStore());
  await service.write({
    userId: "u1",
    items: [
      { key: "wakeup_time", value: "07:30", tags: ["habit"] },
      { key: "diet", value: "light", tags: ["preference"] },
    ],
  });

  const byKey = await service.query({ userId: "u1", keys: ["wakeup_time"] });
  assert.equal(byKey.items.length, 1);
  assert.equal(byKey.items[0]?.key, "wakeup_time");

  const byTag = await service.query({ userId: "u1", tags: ["preference"] });
  assert.equal(byTag.items.length, 1);
  assert.equal(byTag.items[0]?.key, "diet");
});

