# Clear Port 3000 Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Excel Academy - Port 3000 Cleaner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: Checking for processes using port 3000..." -ForegroundColor Yellow

# Get processes using port 3000
$connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$killedCount = 0

if ($connections) {
    Write-Host "Found $($connections.Count) connection(s) on port 3000" -ForegroundColor Red
    foreach ($conn in $connections) {
        $pid = $conn.OwningProcess
        if ($pid -gt 0) {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "  - Process: $($process.ProcessName) (PID: $pid, State: $($conn.State))" -ForegroundColor Yellow
                try {
                    Stop-Process -Id $pid -Force -ErrorAction Stop
                    Write-Host "    ✓ Killed successfully" -ForegroundColor Green
                    $killedCount++
                } catch {
                    Write-Host "    ✗ Failed to kill (may need admin privileges)" -ForegroundColor Red
                    Write-Host "      Try: taskkill /F /PID $pid" -ForegroundColor Gray
                }
            }
        }
    }
} else {
    Write-Host "No connections found on port 3000" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Killing all Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        Write-Host "  - Killing Node.js (PID: $($_.Id))" -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        $killedCount++
    }
    Write-Host "  ✓ All Node.js processes killed" -ForegroundColor Green
} else {
    Write-Host "No Node.js processes found" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Waiting for port to be released..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Step 4: Verifying port status..." -ForegroundColor Yellow
$stillInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($stillInUse) {
    $activeConnections = $stillInUse | Where-Object { $_.State -eq 'Listen' -or $_.State -eq 'Established' }
    if ($activeConnections) {
        Write-Host "⚠ Port 3000 is still in use!" -ForegroundColor Red
        $activeConnections | ForEach-Object {
            Write-Host "  - PID: $($_.OwningProcess), State: $($_.State)" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "You may need to:" -ForegroundColor Yellow
        Write-Host "  1. Run this script as Administrator" -ForegroundColor Yellow
        Write-Host "  2. Manually kill the process in Task Manager" -ForegroundColor Yellow
        Write-Host "  3. Restart your computer" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Port 3000 is free (only TimeWait connections remaining)" -ForegroundColor Green
    }
} else {
    Write-Host "✓ Port 3000 is completely free!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($killedCount -gt 0) {
    Write-Host "Summary: Killed $killedCount process(es)" -ForegroundColor Cyan
} else {
    Write-Host "Summary: No processes needed to be killed" -ForegroundColor Cyan
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now start the server using:" -ForegroundColor Green
Write-Host "  - START_SERVER.bat" -ForegroundColor White
Write-Host "  - npm run dev" -ForegroundColor White
Write-Host ""

