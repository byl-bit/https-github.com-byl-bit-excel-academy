@echo off
echo Creating Start Menu shortcut...
powershell -ExecutionPolicy Bypass -File "%~dp0create-shortcut.ps1"
pause

