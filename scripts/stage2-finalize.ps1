$ErrorActionPreference = "Stop"

$repo = "D:\health-manager\ai-server-link"
$audit = Join-Path $repo "audit\round-02-persistence"
$envFile = Join-Path $repo ".env"
$cmdLog = Join-Path $audit "05_commands_output.txt"

New-Item -ItemType Directory -Force -Path $audit | Out-Null

function Write-Section($title) {
  Add-Content -Path $cmdLog -Value ""
  Add-Content -Path $cmdLog -Value ("===== " + $title + " =====")
}

function Run-Cmd($title, $command) {
  Write-Host ""
  Write-Host ("RUN " + $title) -ForegroundColor Cyan
  Write-Section $title

  $oldPref = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  try {
    $output = cmd /c $command 2>&1
    $output | Tee-Object -FilePath $cmdLog -Append | Out-Null

    if ($LASTEXITCODE -ne 0) {
      throw ("Command failed with exit code " + $LASTEXITCODE + ": " + $command)
    }
  }
  finally {
    $ErrorActionPreference = $oldPref
  }
}
Set-Location $repo

Write-Host ""
Write-Host "Stage2 Finalize: Environment and DB Validation" -ForegroundColor Green

# 1. Basic checks
Run-Cmd "node -v" "node -v"
Run-Cmd "corepack pnpm -v" "corepack pnpm -v"
Run-Cmd "where docker" "where docker"
Run-Cmd "docker --version" "docker --version"

$containerName = "ai-server-postgres"
$pgUser = "postgres"
$pgPassword = "postgres"
$pgDb = "ai_server"
$pgPort = "5432"
$databaseUrl = "postgresql://${pgUser}:${pgPassword}@localhost:${pgPort}/${pgDb}?schema=public"

# 2. Start or reuse PostgreSQL
Write-Host ""
Write-Host "Checking postgres container" -ForegroundColor Cyan
Write-Section ("docker ps -a --filter name=" + $containerName)
cmd /c ("docker ps -a --filter name=" + $containerName) 2>&1 | Tee-Object -FilePath $cmdLog -Append

$existing = cmd /c ("docker ps -a --filter name=" + $containerName + " --format {{.Names}}") 2>&1

if ($existing -match $containerName) {
  Run-Cmd ("docker start " + $containerName) ("docker start " + $containerName)
} else {
  $runCmd = "docker run --name " + $containerName +
    " -e POSTGRES_USER=" + $pgUser +
    " -e POSTGRES_PASSWORD=" + $pgPassword +
    " -e POSTGRES_DB=" + $pgDb +
    " -p " + $pgPort + ":5432 -d postgres:16"
  Run-Cmd "docker run postgres" $runCmd
}

# 3. Wait for DB ready
Write-Host ""
Write-Host "Waiting for postgres to become ready" -ForegroundColor Cyan
Write-Section "wait for postgres ready"

$ready = $false
for ($i = 1; $i -le 30; $i++) {
  $out = cmd /c ("docker exec " + $containerName + " pg_isready -U " + $pgUser + " -d " + $pgDb) 2>&1
  $out | Tee-Object -FilePath $cmdLog -Append | Out-Null
  if ($out -match "accepting connections") {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 2
}

if (-not $ready) {
  throw ("PostgreSQL container not ready. Check log: " + $cmdLog)
}

# 4. Write .env
Write-Host ""
Write-Host "Writing .env" -ForegroundColor Cyan
Write-Section "write .env"

$envContent = @"
DATABASE_URL=$databaseUrl
REDIS_URL=redis://localhost:6379
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=ai-server-dev
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
"@

Set-Content -Path $envFile -Value $envContent -Encoding UTF8
Get-Content $envFile | Tee-Object -FilePath $cmdLog -Append | Out-Null

# 5. Validation
Run-Cmd "node scripts/check-schema-spec.js" "node scripts/check-schema-spec.js"
Run-Cmd "corepack pnpm install" "corepack pnpm install"
Run-Cmd "corepack pnpm prisma:generate" "corepack pnpm prisma:generate"
Run-Cmd "corepack pnpm prisma:migrate" "corepack pnpm prisma:migrate"
Run-Cmd "corepack pnpm db:seed" "corepack pnpm db:seed"
Run-Cmd "corepack pnpm --filter main-server test" "corepack pnpm --filter main-server test"
Run-Cmd "corepack pnpm -r test" "corepack pnpm -r test"

# 6. Check core tables
$tableCmd = 'docker exec ' + $containerName + ' psql -U ' + $pgUser + ' -d ' + $pgDb + ' -c "select ''runs'' as table_name, count(*) from runs union all select ''run_events'', count(*) from run_events union all select ''tool_call_logs'', count(*) from tool_call_logs union all select ''model_invoke_logs'', count(*) from model_invoke_logs;"'
Run-Cmd "docker exec psql count core tables" $tableCmd

Write-Host ""
Write-Host "Done. Send these files to ChatGPT for audit:" -ForegroundColor Green
Write-Host $cmdLog
Write-Host "D:\health-manager\ai-server-link\audit\round-02-persistence\02_codex_reply.txt"
Write-Host "D:\health-manager\ai-server-link\audit\round-02-persistence\07_risks.txt"
Write-Host "D:\health-manager\ai-server-link\audit\round-02-persistence\08_notes.txt"

Read-Host "Press Enter to exit"