@echo off
setlocal

title ComfyUI Debug - Check Errors
cd /d "%~dp0"

echo ============================================================================
echo   COMFYUI DEBUG MODE
echo ============================================================================
echo.

:: Set paths
set "BASE_DIR=%cd%"
set "PYTHON=%BASE_DIR%\python_embeded\python.exe"
set "COMFY_DIR=%BASE_DIR%\ComfyUI"

:: Check Python
echo [1/3] Checking Python...
if not exist "%PYTHON%" (
    echo ERROR: Python not found at %PYTHON%
    pause
    exit /b 1
)
"%PYTHON%" --version
echo.

:: Check ComfyUI
echo [2/3] Checking ComfyUI directory...
if not exist "%COMFY_DIR%\main.py" (
    echo ERROR: ComfyUI main.py not found at %COMFY_DIR%
    pause
    exit /b 1
)
echo ComfyUI found: %COMFY_DIR%
echo.

:: Try to start ComfyUI
echo [3/3] Starting ComfyUI (errors will be visible)...
echo.
cd "%COMFY_DIR%"
"%PYTHON%" main.py --listen 0.0.0.0 --port 8188

echo.
echo ============================================================================
echo   ComfyUI stopped or crashed
echo ============================================================================
pause
