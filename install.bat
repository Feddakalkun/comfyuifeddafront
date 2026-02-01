@echo off
setlocal EnableDelayedExpansion

title ComfyFront - Universal Installer
cd /d "%~dp0"

echo ============================================================================
echo   			   FEDDAKALKUN COMFYUI FRONTEND
echo ============================================================================
echo.
echo This script will set up the entire ecosystem:
echo 1. ComfyUI (Generation Engine) + Custom Nodes
echo 2. Dashboard + Dependencies
echo 3. Ollama (AI Chat Engine)
echo.

:: Admin Check
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs -Wait"
    exit /b
)

echo.
echo [Universal Installer] Handing over to PowerShell core...
echo.

powershell -ExecutionPolicy Bypass -File "scripts\install.ps1"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Installation failed!
    pause
    exit /b %errorlevel%
)

echo.
echo ============================================================================
echo   INSTALLATION COMPLETE!
echo ============================================================================
echo.
echo To start the system, run: run.bat
echo.
pause
