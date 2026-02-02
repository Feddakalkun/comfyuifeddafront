@echo off
echo Upgrading Transformers for VibeVoice...
cd /d "%~dp0"

echo Installing required packages...
python_embeded\python.exe -m pip install "transformers>=4.49.0" accelerate

echo.
echo Checking installed version...
python_embeded\python.exe -c "import transformers; print(f'Transformers version: {transformers.__version__}')"

echo.
echo Done! Please restart ComfyUI.
pause
