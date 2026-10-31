@echo off
@chcp 65001 >nul
title Stop Norimono Services
color 0e

echo.
echo ===================================================================
echo   Stopping Norimono Services (Ports 3000 & 5173)...
echo ===================================================================
echo.

:: Kill port 3000 process if running
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Terminating Backend process on PID %%a...
    taskkill /F /PID %%a >nul 2>nul
)

:: Kill port 5173 process if running
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Terminating Frontend process on PID %%a...
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo [DONE] Norimono services have been stopped.
echo.
timeout /t 2 /nobreak >nul
exit /b 0
