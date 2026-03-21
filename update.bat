@echo off
title FEDDA AI Studio - Update
cd /d "%~dp0"

echo.
echo =========================================
echo   FEDDA AI Studio - Update
echo =========================================
echo.
echo This will pull the latest code from GitHub.
echo Close FEDDA first if it is running.
echo.
pause

call scripts\run_update.bat

if %errorlevel% equ 0 (
    echo.
    echo [OK] Update complete. You can now run run.bat
) else (
    echo.
    echo [ERROR] Update failed. Check logs\update.log
)
echo.
pause
