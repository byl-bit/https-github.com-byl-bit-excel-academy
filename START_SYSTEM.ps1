# Excel Academy - System Starter (PowerShell Edition)
$ErrorActionPreference = "Stop"

function Write-Header {
    Clear-Host
    Write-Host "`n ###############################################################" -ForegroundColor Cyan
    Write-Host " #                                                             #" -ForegroundColor Cyan
    Write-Host " #             EXCEL ACADEMY - SCHOOL MANAGEMENT               #" -ForegroundColor Cyan
    Write-Host " #                  POWERSHELL SYSTEM STARTER                  #" -ForegroundColor Cyan
    Write-Host " #                                                             #" -ForegroundColor Cyan
    Write-Host " ###############################################################`n" -ForegroundColor Cyan
    Write-Host " [(Get-Date)]" -ForegroundColor Gray
}

Write-Header
Write-Host " [1/5] Verifying Dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host " [!] Installing missing node_modules..." -ForegroundColor Magenta
    npm install
} else {
    Write-Host " [OK] Dependencies ready." -ForegroundColor Green
}

Write-Host "`n [2/5] Cleaning Network Stack..." -ForegroundColor Yellow
if (Test-Path "clear-port-3000.ps1") {
    powershell -ExecutionPolicy Bypass -File "clear-port-3000.ps1"
    Write-Host " [OK] Port 3000 cleared." -ForegroundColor Green
}

Write-Host "`n [3/5] Database Health Audit..." -ForegroundColor Yellow
if (Test-Path "scripts/verify-db.js") {
    node scripts/verify-db.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host " [!] Database verification failed. Check .env.local" -ForegroundColor Red
        $choice = Read-Host " Continue anyway? (y/n)"
        if ($choice -ne "y") { exit }
    } else {
        Write-Host " [OK] Database link active." -ForegroundColor Green
    }
}

Write-Host "`n [4/5] Purging Cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host " [OK] Next.js cache purged." -ForegroundColor Green
}

Write-Host "`n [5/5] Igniting Next.js Engine..." -ForegroundColor Yellow
Write-Host " ---------------------------------------------------------------" -ForegroundColor Blue
Write-Host " URL: http://localhost:3000/auth/login" -ForegroundColor Cyan
Write-Host " ---------------------------------------------------------------" -ForegroundColor Blue

Start-Process "http://localhost:3000/auth/login"

npm run dev
