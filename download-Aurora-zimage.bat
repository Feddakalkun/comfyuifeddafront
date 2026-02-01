@echo off
setlocal

title Download Aurora Z-Image LoRA
cd /d "%~dp0"

echo ============================================================================
echo   DOWNLOADING AURORA Z-IMAGE LORA
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
set "FOLDER_ID=1AHLknhYsXBGXGXn7bJM35rl14tadtcb4"
set "DEST_DIR=%cd%\ComfyUI\models\loras\Aurora"

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
    echo Aurora LoRA saved to: %DEST_DIR%
    echo.
) else (
    echo.
    echo ERROR: Download failed!
    echo.
)

pause
