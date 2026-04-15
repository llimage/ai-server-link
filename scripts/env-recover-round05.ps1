$ErrorActionPreference = "Continue"

Write-Host "== 1) Kill node/pnpm related processes ==" -ForegroundColor Cyan
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process pnpm -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "== 2) Reset PATH hint ==" -ForegroundColor Cyan
$env:Path = "C:\Program Files\nodejs;$env:USERPROFILE\AppData\Roaming\npm;$env:Path"

Write-Host "== 3) Check node/npm/pnpm ==" -ForegroundColor Cyan
where.exe node
where.exe npm
where.exe pnpm
node -v
npm -v
pnpm -v

Write-Host "== 4) Remove node_modules and lockfile ==" -ForegroundColor Cyan
if (Test-Path ".\node_modules") {
  cmd /c "rd /s /q node_modules"
}
if (Test-Path ".\pnpm-lock.yaml") {
  Remove-Item ".\pnpm-lock.yaml" -Force
}

Write-Host "== 5) Clean temp caches ==" -ForegroundColor Cyan
if (Test-Path "$env:TEMP\pnpm") {
  Remove-Item "$env:TEMP\pnpm" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "$env:LOCALAPPDATA\pnpm-cache") {
  Remove-Item "$env:LOCALAPPDATA\pnpm-cache" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "== 6) Prune pnpm store ==" -ForegroundColor Cyan
pnpm store prune

Write-Host "== 7) Fresh install ==" -ForegroundColor Cyan
pnpm install

Write-Host "== 8) Approve builds if needed ==" -ForegroundColor Cyan
Write-Host "If prompted, approve: @prisma/client, @prisma/engines, prisma, esbuild" -ForegroundColor Yellow

Write-Host "== 9) Prisma generate ==" -ForegroundColor Cyan
pnpm prisma:generate

Write-Host "== 10) Prisma migrate ==" -ForegroundColor Cyan
pnpm prisma:migrate

Write-Host "== 11) Seed ==" -ForegroundColor Cyan
pnpm db:seed

Write-Host "== 12) vector-store-core test ==" -ForegroundColor Cyan
pnpm --filter vector-store-core test

Write-Host "== 13) main-server test ==" -ForegroundColor Cyan
pnpm --filter main-server test

Write-Host "== 14) workspace test ==" -ForegroundColor Cyan
pnpm -r test
