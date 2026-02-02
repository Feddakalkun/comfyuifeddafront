@echo off
echo Reinstalling VibeVoice dependencies...
cd /d "%~dp0"

echo Installing from requirements.txt...
python_embeded\python.exe -m pip install -r ComfyUI\custom_nodes\VibeVoice-ComfyUI\requirements.txt --force-reinstall

echo.
echo Verifying installation...
python_embeded\python.exe debug_vibevoice.py

echo.
echo Done! Please restart ComfyUI.
pause
