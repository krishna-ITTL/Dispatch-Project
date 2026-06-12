@echo off
setlocal enabledelayedexpansion

:: ============================================================
::  Dispatch-ITTL — Production Server
::  Serves: dist/ via sirv-cli on port 5173
::  Logs:   D:\ITTL_PROJECTS\Dispatch-ITTL\logs\server.log
:: ============================================================

set PROJECT_DIR=D:\ITTL_PROJECTS\Dispatch-ITTL
set LOG_FILE=%PROJECT_DIR%\logs\server.log
set PORT=5173

:: Create logs directory if it doesn't exist
if not exist "%PROJECT_DIR%\logs" mkdir "%PROJECT_DIR%\logs"

:: Move to project directory
cd /d "%PROJECT_DIR%"

:: ── LOG HELPER ───────────────────────────────────────────────
:: Usage: call :log "Your message here"
goto :main

:log
    set TIMESTAMP=%DATE% %TIME%
    echo [%TIMESTAMP%] %~1 >> "%LOG_FILE%"
    echo [%TIMESTAMP%] %~1
    goto :eof

:: ── MAIN ─────────────────────────────────────────────────────
:main

call :log "============================================"
call :log "SERVER STARTING — Dispatch-ITTL Production"
call :log "Project Dir : %PROJECT_DIR%"
call :log "Port        : %PORT%"
call :log "URL         : http://192.168.7.135:%PORT%"
call :log "============================================"

:: ── STEP 1: BUILD ────────────────────────────────────────────
call :log "BUILD STARTED — Running npm run build..."
call npm run build >> "%LOG_FILE%" 2>&1

if %ERRORLEVEL% neq 0 (
    call :log "BUILD FAILED — npm run build exited with error code %ERRORLEVEL%"
    call :log "Server will NOT start. Fix build errors and re-run this script."
    pause
    exit /b 1
)

call :log "BUILD SUCCESS — dist/ folder is ready"

:: ── STEP 2: AUTO-RESTART LOOP ────────────────────────────────
:restart_loop

call :log "SERVER STARTING — sirv-cli serving dist/ on port %PORT%"

:: Start sirv and capture exit code
npx sirv-cli dist --port %PORT% --single --host 0.0.0.0

set EXIT_CODE=%ERRORLEVEL%

:: If exit code is 0, user manually stopped it — don't restart
if %EXIT_CODE% equ 0 (
    call :log "SERVER STOPPED — Clean shutdown detected (exit code 0). Not restarting."
    goto :end
)

:: Otherwise it crashed — log and restart
call :log "SERVER CRASHED — Exit code: %EXIT_CODE%. Restarting in 5 seconds..."
timeout /t 5 /nobreak > nul
call :log "RESTARTING SERVER..."
goto :restart_loop

:end
call :log "SERVER ENDED — Dispatch-ITTL production server has stopped."
call :log "============================================"
pause
