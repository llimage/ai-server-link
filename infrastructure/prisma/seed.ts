/**
 * 持久化层基础种子数据脚本
 *
 * 所属模块：
 * * infrastructure/prisma
 *
 * 文件作用：
 * * 初始化第 2 阶段本地开发所需的最小可用数据
 * * 提供 user/session/records/plans/meta/memory 等基础演示数据
 *
 * 主要功能：
 * * upsert demo user
 * * create demo session
 * * create demo records/plans/user-meta/memory
 *
 * 依赖：
 * * @prisma/client
 *
 * 注意事项：
 * * 脚本允许重复执行，重复执行时尽量避免无限新增核心身份数据
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 执行种子写入
 *
 * @returns void
 */
async function main(): Promise<void> {
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@ai-server.local" },
    update: {
      status: "active",
      profileJson: {
        nickname: "demo-user",
      },
    },
    create: {
      email: "demo@ai-server.local",
      phone: "18800000000",
      status: "active",
      profileJson: {
        nickname: "demo-user",
      },
    },
  });

  await prisma.session.create({
    data: {
      userId: demoUser.id,
      sessionToken: `seed_session_${Date.now()}`,
      status: "active",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      metadataJson: {
        source: "seed",
      },
    },
  });

  await prisma.record.create({
    data: {
      userId: demoUser.id,
      space: "general",
      type: "note",
      payloadJson: {
        mood: "good",
      },
      metadataJson: {
        source: "seed",
      },
    },
  });

  const plan = await prisma.plan.create({
    data: {
      userId: demoUser.id,
      space: "general",
      type: "routine",
      status: "draft",
      payloadJson: {
        text: "seed plan",
      },
      metadataJson: {
        source: "seed",
      },
    },
  });

  await prisma.planRun.create({
    data: {
      planId: plan.id,
      status: "created",
      payloadJson: {
        source: "seed",
      },
    },
  });

  await prisma.userMetadataRecord.upsert({
    where: {
      userId_key: {
        userId: demoUser.id,
        key: "wakeup_time",
      },
    },
    update: {
      valueJson: "07:30",
      confidence: 0.9,
      tagsJson: ["seed", "meta"],
    },
    create: {
      userId: demoUser.id,
      key: "wakeup_time",
      valueJson: "07:30",
      confidence: 0.9,
      tagsJson: ["seed", "meta"],
    },
  });

  await prisma.memoryRecord.create({
    data: {
      userId: demoUser.id,
      content: "I prefer morning exercise",
      tagsJson: ["seed", "memory"],
      source: "seed",
    },
  });

  await prisma.memorySummary.create({
    data: {
      userId: demoUser.id,
      summary: "User prefers morning routine.",
      metadataJson: {
        source: "seed",
      },
    },
  });

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
