@echo off
setlocal EnableDelayedExpansion

title Feddakalkun LoRA Downloader (HuggingFace Edition)
color 0B

echo ============================================================================
echo                FEDDAKALKUN LORA DOWNLOADER - HUGGING FACE
echo ============================================================================
echo.
echo Select the LoRA you want to download into ComfyUI/models/loras/z-image
echo.
echo --- PRIMARY CHARACTERS ---
echo 1. Ane                     2. Astrid                  3. Aurora
echo 4. Emma                    5. Emmy                    6. Erle
echo 7. Froy                    8. Helene                  9. Ingrid
echo 10. Iris                   11. Julie                  12. Juna
echo 13. Leah                   14. Lila                   15. Martine
echo 16. Meg                    17. Milli                  18. Sana
echo 19. Sara                   20. Thale                  21. Tiril
echo.
echo --- STYLES ---
echo 30. Lenovo Style           31. Mystic Style           32. Nice Girls Style
echo 33. Photorealistic Skin
echo.
echo --- BATCH ACTIONS ---
echo 90. Download ALL Characters
echo 91. Download ALL Styles
echo 99. Download EVERYTHING (Warning: Large Download)
echo 0. Exit
echo.

set /p choice="Enter the number of your choice: "

set "LORA_DIR=%~dp0ComfyUI\models\loras\z-image"
if not exist "!LORA_DIR!" mkdir "!LORA_DIR!"

set "BASE_URL=https://huggingface.co/datasets/FeddaKalkun/loras/resolve/main"

:: Character Mapping
if "%choice%"=="1"  set "target=Ane/ane-ommundsen.safetensors"
if "%choice%"=="2"  set "target=Astrid/astrid.safetensors"
if "%choice%"=="3"  set "target=Aurora/aurora.safetensors"
if "%choice%"=="4"  set "target=Emma/emma.safetensors"
if "%choice%"=="5"  set "target=Emmy/emmy.safetensors"
if "%choice%"=="6"  set "target=Erle/Erle-zimage.safetensors"
if "%choice%"=="7"  set "target=Froy/froy.safetensors"
if "%choice%"=="8"  set "target=Helene/helene-zimage-schibsted-turbo.safetensors"
if "%choice%"=="9"  set "target=Ingrid/Ingrid_zimage.safetensors"
if "%choice%"=="10" set "target=Iris/iris.safetensors"
if "%choice%"=="11" set "target=Julie/julie-zimage.safetensors"
if "%choice%"=="12" set "target=Juna/juna.safetensors"
if "%choice%"=="13" set "target=Leah/leah.safetensors"
if "%choice%"=="14" set "target=Lila/lila.safetensors"
if "%choice%"=="15" set "target=Martine/martine.safetensors"
if "%choice%"=="16" set "target=Meg/meg.safetensors"
if "%choice%"=="17" set "target=Milli/milli.safetensors"
if "%choice%"=="18" set "target=Sana/sana.safetensors"
if "%choice%"=="19" set "target=Sara/sara.safetensors"
if "%choice%"=="20" set "target=Thale/thale.safetensors"
if "%choice%"=="21" set "target=Tiril/tiril-zimagenew_000004500.safetensors"

:: Style Mapping
if "%choice%"=="30" set "target=Style/lenovo_z.safetensors"
if "%choice%"=="31" set "target=Style/mysticXXXZITV5.KEmz.safetensors"
if "%choice%"=="32" set "target=Style/nicegirls_Zimage.safetensors"
if "%choice%"=="33" set "target=Style/skin-texture-Photorealistic-style-v4.5.safetensors"

if defined target (
    for %%i in ("!target!") do set "filename=%%~nxi"
    echo Downloading !filename!...
    curl -L -o "!LORA_DIR!\!filename!" "!BASE_URL!/!target!?download=true"
    echo Done!
    pause
    exit /b
)

if "%choice%"=="90" goto download_chars
if "%choice%"=="91" goto download_styles
if "%choice%"=="99" goto download_all
if "%choice%"=="0" exit /b

:download_chars
echo Downloading All Characters...
for %%f in (
    "Ane/ane-ommundsen.safetensors"
    "Astrid/astrid.safetensors"
    "Aurora/aurora.safetensors"
    "Emma/emma.safetensors"
    "Emmy/emmy.safetensors"
    "Erle/Erle-zimage.safetensors"
    "Froy/froy.safetensors"
    "Helene/helene-zimage-schibsted-turbo.safetensors"
    "Ingrid/Ingrid_zimage.safetensors"
    "Iris/iris.safetensors"
    "Julie/julie-zimage.safetensors"
    "Juna/juna.safetensors"
    "Leah/leah.safetensors"
    "Lila/lila.safetensors"
    "Martine/martine.safetensors"
    "Meg/meg.safetensors"
    "Milli/milli.safetensors"
    "Sana/sana.safetensors"
    "Sara/sara.safetensors"
    "Thale/thale.safetensors"
    "Tiril/tiril-zimagenew_000004500.safetensors"
) do (
    for %%i in (%%f) do set "fname=%%~nxi"
    echo Downloading !fname!...
    curl -L -o "!LORA_DIR!\!fname!" "!BASE_URL!/%%~f?download=true"
)
echo All Characters Downloaded.
pause
exit /b

:download_styles
echo Downloading All Styles...
for %%f in (
    "Style/lenovo_z.safetensors"
    "Style/mysticXXXZITV5.KEmz.safetensors"
    "Style/nicegirls_Zimage.safetensors"
    "Style/skin-texture-Photorealistic-style-v4.5.safetensors"
) do (
    for %%i in (%%f) do set "fname=%%~nxi"
    echo Downloading !fname!...
    curl -L -o "!LORA_DIR!\!fname!" "!BASE_URL!/%%~f?download=true"
)
echo All Styles Downloaded.
pause
exit /b

:download_all
:: This is basically just running both labels
goto download_chars
goto download_styles
echo Everything Downloaded!
pause
exit /b

echo Invalid choice.
pause
