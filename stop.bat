@echo off
REM DeX Trading Agent - Stop Script (Windows)
REM This script stops all running services

echo ========================================
echo Stopping DeX Trading Agent services...
echo ========================================
echo.

REM Stop Node.js processes (frontend)
taskkill /F /IM node.exe >nul 2>&1
if not errorlevel 1 echo Frontend stopped

REM Stop Python processes (backend and Celery)
taskkill /F /IM python.exe >nul 2>&1
if not errorlevel 1 echo Backend and Celery stopped

echo.
echo All services stopped
pause
