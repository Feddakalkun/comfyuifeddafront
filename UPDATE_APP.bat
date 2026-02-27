@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo      UPDATING COMFYFRONT APPLICATION
echo ==========================================
echo.
echo Pulling latest changes from GitHub...

:: Use embedded git if system git is not available
where git >nul 2>&1
if %errorlevel% neq 0 (
    if exist "%~dp0git_embeded\cmd\git.exe" (
        echo Using embedded git...
        set "PATH=%~dp0git_embeded\cmd;%PATH%"
    ) else (
        echo [ERROR] Git not found! Please run install.bat first.
        pause
        exit /b 1
    )
)

git pull origin main

echo.
echo Running repair and installation script...
powershell -ExecutionPolicy Bypass -File "scripts\update_logic.ps1"

echo.
echo Update finished.
pause
