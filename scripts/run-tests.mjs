import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const root = process.argv[2] || "src";

function collect(dir) {
  const results = [];
  for (const file of readdirSync(dir)) {
    const full = join(dir, file);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (file === "node_modules") continue;
      results.push(...collect(full));
    } else if (file.endsWith(".test.ts") || file.endsWith(".spec.ts")) {
      results.push(full);
    }
  }
  return results;
}

const files = collect(root);

if (files.length === 0) {
  console.log("No tests found");
  process.exit(0);
}

console.log("Running tests:", files);

let tsxCliPath = "";
try {
  const tsxPkgJson = require.resolve("tsx/package.json");
  const tsxPkgDir = dirname(tsxPkgJson);
  tsxCliPath = join(tsxPkgDir, "dist", "cli.mjs");
} catch (err) {
  console.error("Failed to locate tsx package:", err);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [tsxCliPath, "--test", ...files],
  {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  }
);

if (result.error) {
  console.error("Test runner failed to spawn tsx:", result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
