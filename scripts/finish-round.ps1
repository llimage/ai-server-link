param(
    [string]$round = ""
)

$ErrorActionPreference = "Stop"

if (!(Test-Path "audit")) {
    throw "缺少 audit 目录"
}

if ([string]::IsNullOrWhiteSpace($round)) {
    $latest = Get-ChildItem "audit" -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^round-(\d+)' } |
        Sort-Object Name |
        Select-Object -Last 1

    if ($null -eq $latest) {
        throw "未找到任何 round 目录，请先运行 start-round.ps1"
    }

    $round = $latest.Name
}

$roundPath = Join-Path "audit" $round

if (!(Test-Path $roundPath)) {
    throw "目录不存在: $roundPath"
}

$required = @(
    "01_task.txt",
    "02_codex_reply.txt",
    "03_tree.txt",
    "04_key_files.txt",
    "05_commands_output.txt",
    "06_error_files_bundle.txt",
    "07_risks.txt",
    "08_notes.txt"
)

$missing = @()
$empty = @()

foreach ($file in $required) {
    $full = Join-Path $roundPath $file
    if (!(Test-Path $full)) {
        $missing += $file
    }
    else {
        $item = Get-Item $full
        if ($item.Length -eq 0) {
            $empty += $file
        }
    }
}

Write-Host "===================="
Write-Host "Round 检查"
Write-Host "===================="
Write-Host "目录: $roundPath"

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ 缺少文件:"
    $missing | ForEach-Object { Write-Host " - $_" }
} else {
    Write-Host "✅ 必需文件齐全"
}

if ($empty.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️ 空文件:"
    $empty | ForEach-Object { Write-Host " - $_" }
} else {
    Write-Host "✅ 无空文件"
}

Write-Host ""
Write-Host "===================="
Write-Host "Git 状态"
Write-Host "===================="
git status

Write-Host ""
Write-Host "===================="
Write-Host "Git 提交"
Write-Host "===================="

git add .

$ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMsg = "round complete: $round"

git commit -m $commitMsg 2>$null | Out-Null

Write-Host "✅ 已尝试提交: $commitMsg"

Write-Host ""
Write-Host "===================="
Write-Host "Git 推送"
Write-Host "===================="

git push

Write-Host ""
Write-Host "✅ finish-round 完成"
Write-Host "👉 如仍有空文件，请补完后再次执行 finish-round.ps1"
