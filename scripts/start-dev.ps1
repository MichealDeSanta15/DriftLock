<#
.SYNOPSIS
    Starts all DriftLock dev services, each in its own window: backend (FastAPI),
    frontend (Next.js), and the local demo site used for live demos.

.USAGE
    Run from anywhere:  .\scripts\start-dev.ps1
#>

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

# Docker/Postgres isn't set up on this machine, so dev uses a local SQLite
# file instead. Swap this to a postgresql:// URL once Docker/Postgres exist.
$dbUrl = "sqlite:///./backend/driftlock.db"
$dbPath = Join-Path $root "backend\driftlock.db"

if (-not (Test-Path $dbPath)) {
    Write-Host "No local database found - initializing $dbPath ..."
    Push-Location $root
    $env:DATABASE_URL = $dbUrl
    python -c "from backend.db import init_db; init_db()"
    Pop-Location
}

# Deliberately no --reload: uvicorn's reload mode spawns a child worker
# process that survives Stop-Process on the parent, leaking an orphaned
# process pinned to port 8000. Restart this script if you edit backend code.
Write-Host "Starting backend (FastAPI) -> http://localhost:8000 ..."
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root'; `$env:DATABASE_URL='$dbUrl'; python -m uvicorn backend.api:app --host 0.0.0.0 --port 8000"
)

Write-Host "Starting frontend (Next.js) -> http://localhost:3000 ..."
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root'; npm run dev"
)

Write-Host "Starting demo site -> http://localhost:8090 ..."
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$root\demo-site'; python -m http.server 8090"
)

Write-Host ""
Write-Host "All three services are starting in separate windows (leave them open)."
Write-Host "Give them ~5 seconds, then open:"
Write-Host "  Frontend:  http://localhost:3000  (Next.js will print the actual port if 3000 is busy)"
Write-Host "  Backend:   http://localhost:8000/docs"
Write-Host "  Demo site: http://localhost:8090"
Write-Host ""
Write-Host "To stop everything:  .\scripts\stop-dev.ps1"
