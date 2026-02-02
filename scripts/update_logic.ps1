$ErrorActionPreference = "Stop"
$ScriptPath = $PSScriptRoot
$RootPath = Split-Path -Parent $ScriptPath
Set-Location $RootPath

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "      COMFYFRONT UPDATE & REPAIR UTILITY" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Define Paths
$PyExe = Join-Path $RootPath "python_embeded\python.exe"
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

Write-Host "`n===================================================" -ForegroundColor Green
Write-Host "   UPDATE COMPLETE - READY TO GENERATE!" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host "You can now close this window and run 'run.bat'"
