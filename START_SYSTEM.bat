@echo off
SETLOCAL EnableDelayedExpansion
title Excel Academy - System Controller
color 0b

:start
cls
echo.
echo  ###############################################################
echo  #                                                             #
echo  #             EXCEL ACADEMY - SCHOOL MANAGEMENT               #
echo  #                  PREMIUM SYSTEM CONTROLLER                  #
echo  #                                                             #
echo  ###############################################################
echo.
echo  [%DATE% %TIME%]
echo  STATUS: SYSTEM INITIALIZING...
echo.

echo  [1/6] VERIFYING DEPENDENCIES...
if not exist "node_modules\" (
    echo.
    echo  [!] node_modules not found. Installing dependencies...
    call npm install
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo  [CRITICAL] Dependency installation failed.
        pause
        exit /b 1
    )
) else (
    echo  [OK] Dependencies verified.
)

echo.
echo  [2/6] RECOVERING NETWORK PORT 3000...
echo  Cleaning up any ghost processes...
powershell -ExecutionPolicy Bypass -File "clear-port-3000.ps1" > nul 2>&1
echo  [OK] Port 3000 is ready.

echo.
echo  [3/6] ENVIRONMENT HEALTH CHECK...
if not exist ".env.local" (
    echo.
    echo  [!!] CRITICAL WARNING: .env.local MISSING!
    echo       The system may not connect to the database.
    echo.
    set /p "choice=Continue anyway? (y/n): "
    if /i "!choice!" NEQ "y" (
        echo  Exiting...
        pause
        exit /b 1
    )
) else (
    echo  [OK] Environment variables detected.
)

echo.
echo  [4/6] DATABASE CONNECTIVITY TEST...
echo  Verifying Supabase link and schema tables...
call node scripts/verify-db.js
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo  [WARNING] Database verification returned errors.
    echo  Please check your Supabase credentials in .env.local
    echo.
    set /p "choice=Continue anyway? (y/n): "
    if /i "!choice!" NEQ "y" (
        echo  Exiting...
        pause
        exit /b 1
    )
) else (
    echo  [OK] Database health: OPTIMAL.
)

echo.
echo  [5/6] PREPARING ENGINE CACHE...
if exist ".next\" (
    echo  Flushing old build assets for maximum speed...
    rmdir /s /q .next > nul 2>&1
)
echo  [OK] System cache ready.

echo.
echo  [6/6] LAUNCHING NEXT.JS ENGINE...
echo  ---------------------------------------------------------------
echo  PORTAL URL: http://localhost:3000/auth/login
echo  ---------------------------------------------------------------
echo.

:: Start the browser automatically to the login page
timeout /t 3 /nobreak > nul
start http://localhost:3000/auth/login 2>nul

:: Run the dev server
call npm run dev

if !ERRORLEVEL! NEQ 0 (
    echo.
    echo  [CRITICAL] Engine experienced a failure.
    echo  Checking logs...
    echo.
    set /p "restart=Would you like to auto-restart the engine? (y/n): "
    if /i "!restart!"=="y" goto start
)

echo.
echo  System session ended.
pause