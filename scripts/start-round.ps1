param(
    [string]$name = "task"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path "audit")) {
    New-Item -ItemType Directory -Path "audit" | Out-Null
}

$roundDirs = Get-ChildItem "audit" -Directory -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match '^round-(\d+)'
}

$next = 1
$nums = @()

foreach ($dir in $roundDirs) {
    if ($dir.Name -match '^round-(\d+)') {
        $nums += [int]$Matches[1]
    }
}

if ($nums.Count -gt 0) {
    $max = ($nums | Measure-Object -Maximum).Maximum
    if ($max -ne $null) {
        $next = [int]$max + 1
    }
}

$roundNum = ([string]$next).PadLeft(2, '0')
$roundName = "round-$roundNum-$name"
$path = Join-Path "audit" $roundName

New-Item -ItemType Directory -Path $path -Force | Out-Null

$sopPath = "docs/项目总纲+SOP.md"
$rulesPath = "docs/代码编码执行方行为规范.md"

if (!(Test-Path $sopPath)) {
    throw "缺少文件: $sopPath"
}
if (!(Test-Path $rulesPath)) {
    throw "缺少文件: $rulesPath"
}

$sop = Get-Content $sopPath -Raw -Encoding UTF8
$rules = Get-Content $rulesPath -Raw -Encoding UTF8

$taskFile = Join-Path $path "01_task.txt"

@"
====================
项目总纲
====================
$sop

====================
执行方行为规范
====================
$rules

====================
本轮任务
====================
（在这里填写你的任务）
"@ | Out-File -FilePath $taskFile -Encoding utf8

$placeholders = @(
    "02_codex_reply.txt",
    "03_tree.txt",
    "04_key_files.txt",
    "05_commands_output.txt",
    "06_error_files_bundle.txt",
    "07_risks.txt",
    "08_notes.txt"
)

foreach ($file in $placeholders) {
    $full = Join-Path $path $file
    if (!(Test-Path $full)) {
        New-Item -ItemType File -Path $full | Out-Null
    }
}

git add . | Out-Null
git commit -m "checkpoint: before $roundName" 2>$null | Out-Null

Write-Host "✅ 已创建：$path"
Write-Host "✅ 已生成：$taskFile"
Write-Host "👉 编辑 01_task.txt 后交给执行方"
