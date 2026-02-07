@echo off
setlocal
cd /d "%~dp0"
title FEDDA Fix GPU v2

set "PYTHON=%cd%\python_embeded\python.exe"

echo 1. Cleaning up broken installations...
"%PYTHON%" -m pip uninstall -y torch torchvision torchaudio xformers

echo.
echo 2. Installing PyTorch (CUDA 12.4) - This WILL download ~2.5GB.
echo Please wait patiently...
"%PYTHON%" -m pip install torch==2.5.1+cu124 torchvision==0.20.1+cu124 torchaudio==2.5.1+cu124 --index-url https://download.pytorch.org/whl/cu124

echo.
echo 3. Installing Xformers (Compatible version)...
"%PYTHON%" -m pip install xformers==0.0.28.post3 --index-url https://download.pytorch.org/whl/cu124 --extra-index-url https://pypi.org/simple
:: Fallback to just xformers if specific version fails
if %errorlevel% neq 0 (
    echo Fallback: Installing latest xformers...
    "%PYTHON%" -m pip install xformers --extra-index-url https://download.pytorch.org/whl/cu124
)

echo.
echo ========================================================
echo  DONE! GPU SHOULD WORK NOW.
echo ========================================================
pause
