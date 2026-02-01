@echo off
setlocal

title LoRA Downloader - ComfyFront
cd /d "%~dp0.."

echo ============================================================================
echo   LORA DOWNLOADER
echo ============================================================================
echo.
echo Downloading character LoRAs from Google Drive...
echo.

:: Use portable Python
set "PYTHON=%cd%\python_embeded\python.exe"

if not exist "%PYTHON%" (
    echo ERROR: Python not found!
    echo Please run install.bat first.
    pause
    exit /b 1
)

:: Run the download script
"%PYTHON%" scripts\download_loras.py

pause
