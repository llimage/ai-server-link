const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const schemaPath = path.join(repoRoot, "infrastructure", "prisma", "schema.prisma");
const specPath = path.join(repoRoot, "docs", "PROJECT_SPEC.md");

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
}

function warn(msg) {
  console.warn(`⚠️  ${msg}`);
}

function pass(msg) {
  console.log(`✅ ${msg}`);
}

if (!fs.existsSync(schemaPath)) {
  fail(`schema.prisma 不存在: ${schemaPath}`);
  process.exit(1);
}

if (!fs.existsSync(specPath)) {
  warn(`PROJECT_SPEC.md 不存在: ${specPath}`);
}

const schema = fs.readFileSync(schemaPath, "utf8");

const forbiddenWords = [
  "Medication",
  "Checkin",
  "Health",
  "Diet",
  "Symptom",
  "Prescription",
  "Workout",
  "BloodPressure",
];

const requiredModels = [
  "User",
  "Session",
  "Run",
  "RunEvent",
  "ToolCallLog",
  "ModelInvokeLog",
  "AuditLog",
  "UserMetadataRecord",
  "MemoryRecord",
  "MemorySummary",
  "Record",
  "Plan",
];

const requiredModelFields = {
  Record: ["userId", "space", "type", "payloadJson"],
  Plan: ["userId", "space", "type", "status", "payloadJson"],
  UserMetadataRecord: ["userId", "key", "valueJson"],
  MemoryRecord: ["userId", "content"],
  Run: ["sessionId", "status"],
  ToolCallLog: ["toolName", "status"],
  ModelInvokeLog: ["requestId", "modelId", "provider", "success"],
};

function extractModels(text) {
  const models = {};
  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let match;
  while ((match = modelRegex.exec(text)) !== null) {
    models[match[1]] = match[2];
  }
  return models;
}

function hasField(modelBody, fieldName) {
  const fieldRegex = new RegExp(`^\\s*${fieldName}\\s+`, "m");
  return fieldRegex.test(modelBody);
}

function hasUniqueConstraint(modelBody, fields) {
  const joined = fields.join("\\s*,\\s*");
  const re = new RegExp(`@@unique\\(\\[\\s*${joined}\\s*\\]\\)`);
  return re.test(modelBody.replace(/\s+/g, " "));
}

function hasIndex(modelBody, fields) {
  const joined = fields.join("\\s*,\\s*");
  const re = new RegExp(`@@index\\(\\[\\s*${joined}\\s*\\]\\)`);
  return re.test(modelBody.replace(/\s+/g, " "));
}

let ok = true;

for (const word of forbiddenWords) {
  const re = new RegExp(`model\\s+${word}\\b`);
  if (re.test(schema)) {
    fail(`发现禁止的业务模型: ${word}`);
    ok = false;
  }
}

const models = extractModels(schema);

for (const modelName of requiredModels) {
  if (!models[modelName]) {
    fail(`缺少必须模型: ${modelName}`);
    ok = false;
  } else {
    pass(`存在模型: ${modelName}`);
  }
}

for (const [modelName, fields] of Object.entries(requiredModelFields)) {
  const body = models[modelName];
  if (!body) continue;
  for (const field of fields) {
    if (!hasField(body, field)) {
      fail(`${modelName} 缺少必须字段: ${field}`);
      ok = false;
    } else {
      pass(`${modelName}.${field} 存在`);
    }
  }
}

if (models.UserMetadataRecord) {
  if (!hasUniqueConstraint(models.UserMetadataRecord, ["userId", "key"])) {
    warn("UserMetadataRecord 建议添加 @@unique([userId, key])");
  } else {
    pass("UserMetadataRecord 已包含 @@unique([userId, key])");
  }
}

if (models.Record) {
  if (!hasIndex(models.Record, ["userId", "createdAt"])) {
    warn("Record 建议添加 @@index([userId, createdAt])");
  } else {
    pass("Record 已包含 @@index([userId, createdAt])");
  }
}

if (models.MemoryRecord) {
  if (!hasIndex(models.MemoryRecord, ["userId", "createdAt"])) {
    warn("MemoryRecord 建议添加 @@index([userId, createdAt])");
  } else {
    pass("MemoryRecord 已包含 @@index([userId, createdAt])");
  }
}

if (ok) {
  console.log("\n🎯 schema 与 PROJECT_SPEC 的核心规则检查通过。");
} else {
  console.log("\n❗ schema 检查未通过，请修复上述错误。");
  process.exitCode = 1;
}
