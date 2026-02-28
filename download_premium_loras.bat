@echo off
setlocal EnableDelayedExpansion

title Feddakalkun Premium Downloader
color 0B

echo ============================================================================
echo   		   FEDDAKALKUN PREMIUM LORA DOWNLOADER
echo ============================================================================
echo.
echo Select the Z-Image Premium LoRA you have purchased to download it
echo directly into your ComfyUI models folder.
echo.
echo 1. Elev (The Classic - 4:5 optimized)
echo 2. Froy (Athletic - Sharp Features)
echo 3. Sara (Curvy - Soft Lighting)
echo 4. Lila (The Secret Acc)
echo 5. Iris (Massive Detail)
echo 6. Download ALL (Requires Ultimate Pack)
echo 0. Exit
echo.

set /p choice="Enter the number of your choice: "

set "LORA_DIR=%~dp0ComfyUI\models\loras\z-image"
if not exist "!LORA_DIR!" mkdir "!LORA_DIR!"

if "%choice%"=="1" (
    echo Downloading Elev LoRA...
    :: Add real direct download link here later
    curl -L -o "!LORA_DIR!\elev-zimage.safetensors" "https://example.com/download/elev"
    echo Done!
    pause
    exit /b
)
if "%choice%"=="2" (
    echo Downloading Froy LoRA...
    curl -L -o "!LORA_DIR!\Froy_zimage.safetensors" "https://example.com/download/froy"
    echo Done!
    pause
    exit /b
)
if "%choice%"=="3" (
    echo Downloading Sara LoRA...
    curl -L -o "!LORA_DIR!\Sara_zimage.safetensors" "https://example.com/download/sara"
    echo Done!
    pause
    exit /b
)
if "%choice%"=="4" (
    echo Downloading Lila LoRA...
    curl -L -o "!LORA_DIR!\Lila-zimage.safetensors" "https://example.com/download/lila"
    echo Done!
    pause
    exit /b
)
if "%choice%"=="5" (
    echo Downloading Iris LoRA...
    curl -L -o "!LORA_DIR!\Iris.safetensors" "https://example.com/download/iris"
    echo Done!
    pause
    exit /b
)
if "%choice%"=="6" (
    echo Downloading All Premium LoRAs...
    :: Example of multiple downloads
    curl -L -o "!LORA_DIR!\elev-zimage.safetensors" "https://example.com/download/elev"
    curl -L -o "!LORA_DIR!\Froy_zimage.safetensors" "https://example.com/download/froy"
    curl -L -o "!LORA_DIR!\Sara_zimage.safetensors" "https://example.com/download/sara"
    curl -L -o "!LORA_DIR!\Lila-zimage.safetensors" "https://example.com/download/lila"
    curl -L -o "!LORA_DIR!\Iris.safetensors" "https://example.com/download/iris"
    echo All downloads complete!
    pause
    exit /b
)
if "%choice%"=="0" (
    exit /b
)

echo Invalid choice.
pause
