@echo off
echo ===================================================
echo   COMFYFRONT - REPAIR ENVIRONMENT
echo ===================================================
echo.
echo This script will fix module conflicts by reinstalling Torch stack and Transformers.
echo.
cd /d "%~dp0"

set "PYTHON=%~dp0python_embeded\python.exe"

echo [1/4] Uninstalling problematic packages...
"%PYTHON%" -m pip uninstall -y torch torchvision torchaudio transformers accelerate

echo.
echo [2/4] Reinstalling PyTorch Stack (CUDA 12.1)...
"%PYTHON%" -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

echo.
echo [3/4] Installing correct Transformers version (4.48.2)...
"%PYTHON%" -m pip install "transformers==4.48.2" "accelerate>=0.26.0"

echo.
echo [4/4] Verifying installation...
"%PYTHON%" -c "import torch; print(f'Torch: {torch.__version__}, CUDA: {torch.cuda.is_available()}'); import transformers; print(f'Transformers: {transformers.__version__}')"

echo.
echo Done! restart ComfyUI.
pause
