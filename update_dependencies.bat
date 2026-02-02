@echo off
title ComfyFront - Update Dependencies
cd /d "%~dp0"

echo ============================================================================
echo   COMFYFRONT - DEPENDENCY UPDATE
echo ============================================================================
echo.
echo This will update critical dependencies for voice features
echo.

set "PYTHON=%~dp0python_embeded\python.exe"

if not exist "%PYTHON%" (
    echo ERROR: Python not found! Run install.bat first.
    pause
    exit /b 1
)

echo [1/3] Installing VibeVoice dependencies...
"%PYTHON%" -m pip install "transformers>=4.51.3,<5.0.0" "accelerate>=1.6.0" "bitsandbytes>=0.48.1"

echo.
echo [2/3] Upgrading FastAPI for backend server...
"%PYTHON%" -m pip install --upgrade fastapi uvicorn python-multipart

echo.
echo [3/3] Cleaning legacy ComfyUI Manager backup...
set "LEGACY_BACKUP=%~dp0ComfyUI\user\__manager\.legacy-manager-backup"
if exist "%LEGACY_BACKUP%" (
    rmdir /s /q "%LEGACY_BACKUP%"
    echo Legacy backup removed.
) else (
    echo No legacy backup found.
)

echo.
echo ============================================================================
echo   UPDATE COMPLETE!
echo ============================================================================
echo.
echo Please restart ComfyUI if it's currently running.
echo.
pause
