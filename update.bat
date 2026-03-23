@echo off
setlocal EnableDelayedExpansion
title FEDDA AI Studio - Update
cd /d "%~dp0"

set "BASE_DIR=%~dp0"
if "%BASE_DIR:~-1%"=="\" set "BASE_DIR=%BASE_DIR:~0,-1%"

echo.
echo =========================================
echo   FEDDA AI Studio - Update
echo =========================================
echo.
echo This will pull the latest code from GitHub.
echo Close FEDDA first if it is running.
echo.
pause

:: ============================================================================
:: GIT SETUP
:: ============================================================================
if exist "%BASE_DIR%\git_embeded\cmd\git.exe" (
    set "GIT_EXE=%BASE_DIR%\git_embeded\cmd\git.exe"
    set "PATH=%BASE_DIR%\git_embeded\cmd;%PATH%"
) else (
    set "GIT_EXE=git"
)

:: Fix dubious ownership (local config only)
set "GIT_CONFIG_GLOBAL=%BASE_DIR%\.gitconfig"
"%GIT_EXE%" config --file "%GIT_CONFIG_GLOBAL%" --add safe.directory * >nul 2>&1

:: ============================================================================
:: INIT GIT IF NEEDED (fresh ZIP download)
:: ============================================================================
if not exist "%BASE_DIR%\.git" (
    echo.
    echo [SETUP] No git repo found. Initializing from GitHub...
    "%GIT_EXE%" init
    "%GIT_EXE%" remote add origin https://github.com/Feddakalkun/comfyuifeddafront.git
)

:: ============================================================================
:: PULL LATEST CODE
:: ============================================================================
echo.
echo [1/2] Pulling latest code from GitHub...

"%GIT_EXE%" fetch origin main
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to fetch from GitHub. Check your internet connection.
    echo.
    pause
    exit /b 1
)

"%GIT_EXE%" reset --hard origin/main
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to reset to latest version.
    echo.
    pause
    exit /b 1
)

"%GIT_EXE%" clean -fd >nul 2>&1

echo [OK] Code updated successfully.

:: ============================================================================
:: INSTALL FRONTEND DEPENDENCIES (if needed)
:: ============================================================================
echo.
echo [2/2] Checking frontend dependencies...

if exist "%BASE_DIR%\frontend\node_modules" (
    echo [OK] node_modules exists. Will auto-update on next run if needed.
) else (
    echo [INFO] node_modules missing — will be installed on next run.
)

:: ============================================================================
:: DONE
:: ============================================================================
echo.
echo =========================================
echo   UPDATE COMPLETE
echo =========================================
echo.
echo   Run RUN.bat to start FEDDA.
echo.
pause
