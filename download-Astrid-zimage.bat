@echo off
setlocal

title Download Astrid Z-Image LoRA
cd /d "%~dp0"

echo ============================================================================
echo   DOWNLOADING ASTRID Z-IMAGE LORA
echo ============================================================================
echo.

:: Use portable Python
set "PYTHON=%cd%\python_embeded\python.exe"

if not exist "%PYTHON%" (
    echo ERROR: Python not found! Run install.bat first.
    pause
    exit /b 1
)

:: Install gdown if needed
echo Checking gdown...
"%PYTHON%" -m pip install -q gdown

:: Google Drive folder ID
set "FOLDER_ID=15DVOHttSMALtBIHVtl4xuo4Y5OVkEflW"
set "DEST_DIR=%cd%\ComfyUI\models\loras\Astrid"

echo.
echo Downloading from Google Drive...
echo Destination: %DEST_DIR%
echo.

:: Download folder
"%PYTHON%" -c "import gdown; gdown.download_folder(id='%FOLDER_ID%', output='%DEST_DIR%', quiet=False)"

if %errorlevel% equ 0 (
    echo.
    echo ============================================================================
    echo   DOWNLOAD COMPLETE!
    echo ============================================================================
    echo.
    echo Astrid LoRA saved to: %DEST_DIR%
    echo.
) else (
    echo.
    echo ERROR: Download failed!
    echo.
)

pause
