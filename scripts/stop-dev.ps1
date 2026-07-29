<#
.SYNOPSIS
    Stops the DriftLock dev services started by start-dev.ps1
    (backend on 8000, frontend on 3001, demo site on 8090).

    Deliberately does NOT touch port 3000: this machine has another,
    unrelated project that sometimes runs there, and start-dev.ps1 lets
    Next.js fall back to 3001 rather than fighting over 3000.
#>

$ports = 8000, 3001, 8090

foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        Write-Host "Stopping process on port $port (PID $($c.OwningProcess))"
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Done."
