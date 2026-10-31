@echo off
@chcp 65001 >nul
title Norimono Launcher
color 0b

echo.
echo ===================================================================
echo     _   _  ____  ____  ___ __  __  ___  _   _  ___  
echo    ^| \ ^| ^|/ __ \^|  _ \^|_ _^|  \/  ^|/ _ \^| \ ^| ^|/ _ \ 
echo    ^|  \^| ^| ^|  ^| ^| ^|_) ^|^| ^|^| ^|\/^| ^| ^| ^| ^|  \^| ^| ^| ^| ^|
echo    ^| ^|\  ^| ^|__^| ^|  _ ^< ^| ^|^| ^|  ^| ^| ^|_^| ^| ^|\  ^| ^|_^| ^|
echo    ^|_^| \_^\____/^|_^| \_\___^|_^|  ^|_^|\___/^|_^| \_^\___/ 
echo.
echo         Dual-Engine Corporate Mobility Platform
echo ===================================================================
echo.

:: 1. Verify Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Node.js is not installed or not in your system PATH.
    echo Please install Node.js from https://nodejs.org/ to run Norimono.
    echo.
    pause
    exit /b 1
)

:: 2. Verify backend node_modules
if not exist "%~dp0backend\node_modules" (
    echo [SETUP] Installing backend dependencies...
    cd /d "%~dp0backend"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Backend npm install failed.
        pause
        exit /b 1
    )
)

:: 3. Verify frontend node_modules
if not exist "%~dp0react-frontend\node_modules" (
    echo [SETUP] Installing frontend dependencies...
    cd /d "%~dp0react-frontend"
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Frontend npm install failed.
        pause
        exit /b 1
    )
)

echo [1/3] Starting Norimono Express Backend on port 3000...
start "Norimono Backend [Port 3000]" cmd /k "title Norimono Backend [Port 3000] && cd /d "%~dp0backend" && npm start"

echo [2/3] Starting Norimono React Vite Client on port 5173...
start "Norimono Frontend [Port 5173]" cmd /k "title Norimono Frontend [Port 5173] && cd /d "%~dp0react-frontend" && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 4 /nobreak >nul

echo.
echo ===================================================================
echo   NORIMONO IS RUNNING!
echo ===================================================================
echo   Frontend App:   http://localhost:5173
echo   Backend API:    http://localhost:3000
echo.
echo   DEMO CREDENTIALS:
echo   ---------------------------------------------------------------
echo   * System Admin:        admin@norimono.com   / admin123
echo   * TCS Driver (Female): ananya.s@tcs.com     / norimono123
echo   * Infosys Driver:      rohan.k@infosys.com  / norimono123
echo   * Wipro Driver:        pooja.v@wipro.com    / norimono123
echo ===================================================================
echo.
echo Opening Norimono in your default web browser...
start http://localhost:5173

echo.
echo Keep this window or the background server windows open while using the app.
echo To shut down all Norimono services, you can run stop.bat or close the windows.
echo.
pause
