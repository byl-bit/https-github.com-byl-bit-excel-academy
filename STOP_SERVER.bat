@echo off
SETLOCAL
title Excel Academy - Server Stopper
color 0c

echo.
echo  ###############################################################
echo  #                                                             #
echo  #             EXCEL ACADEMY - SERVER STOPPER                  #
echo  #                                                             #
echo  ###############################################################
echo.
echo  [%DATE% %TIME%]
echo  STATUS: STOPPING SERVER PROCESSES...
echo.

echo  [1/3] FINDING NODE PROCESSES...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo  [STOPPING] Killing all Node.js processes...
    taskkill /F /IM node.exe 2>nul
    echo  [OK] Node.js processes terminated.
) else (
    echo  [OK] No Node.js processes found.
)

echo.
echo  [2/3] FINDING NEXT.JS PROCESSES...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    if not "%%a"=="" (
        echo  [STOPPING] Killing process on port 3000 (PID: %%a)...
        taskkill /F /PID %%a 2>nul
    )
)
echo  [OK] Processes on port 3000 terminated if any.

echo.
echo  [3/3] CLEARING PORT 3000...
powershell -ExecutionPolicy Bypass -File "clear-port-3000.ps1" > nul 2>&1
echo  [OK] Port 3000 cleared.

echo.
echo  Server has been stopped successfully.
echo  You can now start the server again.
echo.
pause