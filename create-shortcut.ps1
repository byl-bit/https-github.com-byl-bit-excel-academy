# Create Start Menu Shortcut for Excel Academy
$StartMenuPath = [Environment]::GetFolderPath('StartMenu')
$ProgramsPath = Join-Path $StartMenuPath 'Programs'
$ExcelAcademyFolder = Join-Path $ProgramsPath 'Excel Academy'

# Create folder if it doesn't exist
if (-not (Test-Path $ExcelAcademyFolder)) {
    New-Item -ItemType Directory -Path $ExcelAcademyFolder -Force | Out-Null
    Write-Host "Created Start Menu folder: $ExcelAcademyFolder"
}

# Get the script directory
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$BatchFile = Join-Path $ScriptPath 'START_SYSTEM.bat'

# Create shortcut
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut((Join-Path $ExcelAcademyFolder 'Start Server.lnk'))
$Shortcut.TargetPath = $BatchFile
$Shortcut.WorkingDirectory = $ScriptPath
$Shortcut.Description = 'Start Excel Academy Development Server'
$Shortcut.IconLocation = 'shell32.dll,13'
$Shortcut.Save()

Write-Host "Start Menu shortcut created successfully!" -ForegroundColor Green
Write-Host "Location: $ExcelAcademyFolder" -ForegroundColor Cyan
Write-Host "Shortcut: Start Server.lnk" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now find 'Excel Academy' in your Start Menu under Programs" -ForegroundColor Yellow

