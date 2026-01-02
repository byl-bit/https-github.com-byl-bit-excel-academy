# Create Desktop Shortcut for Excel Academy
$DesktopPath = [Environment]::GetFolderPath('Desktop')
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$BatchFile = Join-Path $ScriptPath 'START_SERVER.bat'

# Create shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut((Join-Path $DesktopPath 'Excel Academy.lnk'))
$Shortcut.TargetPath = $BatchFile
$Shortcut.WorkingDirectory = $ScriptPath
$Shortcut.Description = 'Start Excel Academy Development Server'
$Shortcut.IconLocation = 'shell32.dll,13'
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "Location: $DesktopPath" -ForegroundColor Cyan

