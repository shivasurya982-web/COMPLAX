# COMPLAX PowerShell Launcher for Windows
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "          COMPLAX LOCAL RUNNER (WINDOWS)           " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`n[1/2] Starting Flask Backend on http://localhost:5000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir\backend'; & '.\.venv\Scripts\python.exe' app.py"

Start-Sleep -Seconds 3

Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$scriptDir\frontend'; npm run dev"

Write-Host "`n===================================================" -ForegroundColor Cyan
Write-Host "COMPLAX is now running!" -ForegroundColor Green
Write-Host "  Frontend : http://localhost:5173/" -ForegroundColor White
Write-Host "  Backend  : http://localhost:5000/" -ForegroundColor White
Write-Host "`nDefault Platform Admin Login:" -ForegroundColor Yellow
Write-Host "  Email    : admin@complax.com" -ForegroundColor White
Write-Host "  Password : admin123" -ForegroundColor White
Write-Host "===================================================`n" -ForegroundColor Cyan
