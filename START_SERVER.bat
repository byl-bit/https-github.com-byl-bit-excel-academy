@echo off
SETLOCAL EnableDelayedExpansion
title Excel Academy - Quick Server Start
color 0a

echo.
echo  ###############################################################
echo  #                                                             #
echo  #             EXCEL ACADEMY - QUICK SERVER START              #
echo  #                                                             #
echo  ###############################################################
echo.
echo  [%DATE% %TIME%]
echo  STATUS: QUICK START INITIALIZING...
echo.

echo  [1/3] RECOVERING NETWORK PORT 3000...
echo  Cleaning up any ghost processes...
powershell -ExecutionPolicy Bypass -File "clear-port-3000.ps1" > nul 2>&1
echo  [OK] Port 3000 is ready.

echo.
echo  [2/3] PREPARING ENGINE CACHE...
if exist ".next\" (
    echo  Flushing old build assets...
    rmdir /s /q .next > nul 2>&1
)
echo  [OK] System cache ready.

echo.
echo  [3/3] LAUNCHING NEXT.JS ENGINE...
echo  ---------------------------------------------------------------
echo  PORTAL URL: http://localhost:3000/auth/login
echo  ---------------------------------------------------------------
echo.

:: Start the browser automatically to the login page
timeout /t 2 /nobreak > nul
start http://localhost:3000/auth/login 2>nul

:: Run the dev server
call npm run dev

echo.
echo  Server session ended.
pause