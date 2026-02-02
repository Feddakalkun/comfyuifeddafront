@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo      UPDATING COMFYFRONT APPLICATION
echo ==========================================
echo.
echo Pulling latest changes from GitHub...
git pull origin main

echo.
echo Running repair and installation script...
powershell -ExecutionPolicy Bypass -File "scripts\update_logic.ps1"

echo.
echo Update finished.
pause
