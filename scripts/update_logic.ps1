$ErrorActionPreference = "Stop"
$ScriptPath = $PSScriptRoot
$RootPath = Split-Path -Parent $ScriptPath
Set-Location $RootPath

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "      COMFYFRONT UPDATE & REPAIR UTILITY" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Define Paths
$PyExe = Join-Path $RootPath "python_embeded\python.exe"

# Pre-flight Check: Ensure Python Exists
if (-not (Test-Path $PyExe)) {
    Write-Host "`n[ERROR] Embedded Python not found!" -ForegroundColor Red
    Write-Host "File missing: $PyExe" -ForegroundColor Grid
    Write-Host "It looks like this is a fresh folder or broken install."
    Write-Host "Please run 'install.bat' strictly BEFORE running update/repair." -ForegroundColor Yellow
    Write-Host "Updates require an existing python environment."
    exit 1
}

$ComfyDir = Join-Path $RootPath "ComfyUI"
$CustomNodesDir = Join-Path $ComfyDir "custom_nodes"
$VoxDir = Join-Path $CustomNodesDir "ComfyUI-VoxCPM"

# 1. Dependency Repair / Downgrade (Critical for Stability)
Write-Host "`n[1/4] Enforcing stable dependencies (Downgrading/Pinning)..." -ForegroundColor Yellow
$StableDeps = @(
    "torch==2.5.1",
    "torchvision==0.20.1", 
    "torchaudio==2.5.1",
    "transformers>=4.48.2,<5.0.0", 
    "accelerate>=0.26.0",
    "bitsandbytes", 
    "soundfile"
)
foreach ($dep in $StableDeps) {
    Write-Host "  - Ensuring $dep..."
    & $PyExe -m pip install "$dep" --index-url https://download.pytorch.org/whl/cu124 --extra-index-url https://pypi.org/simple
}

# Check and Install WanVideo Wrapper
$WanVideoDir = Join-Path $CustomNodesDir "ComfyUI-WanVideo-Wrapper"
if (-not (Test-Path $WanVideoDir)) {
    Write-Host "`n[WanVideo] Installing missing WanVideo nodes..." -ForegroundColor Yellow
    try {
        Set-Location $CustomNodesDir
        & git clone https://github.com/Kijai/ComfyUI-WanVideoWrapper.git $WanVideoDir
        
        if (Test-Path "$WanVideoDir\requirements.txt") {
            Write-Host "Installing requirements..."
            & $PyExe -m pip install -r "$WanVideoDir\requirements.txt"
        }
    }
    catch {
        Write-Host "Failed to install WanVideo Wrapper: $_" -ForegroundColor Red
    }
    Set-Location $RootPath
}

# 2. Install VoxCPM (The new TTS engine)
Write-Host "`n[2/4] Installing VoxCPM TTS Node..." -ForegroundColor Yellow
if (-not (Test-Path $VoxDir)) {
    Write-Host "  - Cloning ComfyUI-VoxCPM..."
    Set-Location $CustomNodesDir
    git clone https://github.com/wildminder/ComfyUI-VoxCPM
    Set-Location $RootPath
}
else {
    Write-Host "  - Updating ComfyUI-VoxCPM..."
    Set-Location $VoxDir
    git pull
    Set-Location $RootPath
}

# 3. Install VoxCPM Dependencies
Write-Host "`n[3/4] Installing VoxCPM requirements..." -ForegroundColor Yellow
if (Test-Path "$VoxDir\requirements.txt") {
    & $PyExe -m pip install -r "$VoxDir\requirements.txt"
}

# 4. Setup Audio Assets
Write-Host "`n[4/4] Setting up audio assets..." -ForegroundColor Yellow
$SetupAudioScript = Join-Path $ScriptPath "setup_tts_audio.py"
if (Test-Path $SetupAudioScript) {
    & $PyExe $SetupAudioScript
}

# 5. Cleanup Old Files
Write-Host "`n[5/5] Cleaning up deprecated files..." -ForegroundColor Yellow
$FilesToDelete = @(
    "check_vibevoice_files.py", 
    "cleanup_vibevoice.py",
    "create_reference_audio.py",
    "debug-comfyui.bat",
    "debug_streamer.py",
    "debug_vibevoice.py",
    "fix_vibevoice_deps.bat",
    "reinstall_vibevoice_deps.bat",
    "repair_environment.bat",
    "setup_tts_audio.py",
    "test_load_model.py",
    "update_dependencies.bat",
    "VOICE_FEATURES_README.md"
)

foreach ($file in $FilesToDelete) {
    $path = Join-Path $RootPath $file
    if (Test-Path $path) {
        Remove-Item -Path $path -Force -ErrorAction SilentlyContinue
        Write-Host "  - Removed: $file"
    }
}

Write-Host "`n===================================================" -ForegroundColor Green
Write-Host "   UPDATE COMPLETE - READY TO GENERATE!" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host "You can now close this window and run 'run.bat'"
