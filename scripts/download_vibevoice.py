"""
Download VibeVoice models from HuggingFace
"""
import os
from pathlib import Path
import requests
from tqdm import tqdm

def download_file(url, dest):
    """Download file with progress bar"""
    response = requests.get(url, stream=True)
    if response.status_code != 200:
        print(f"❌ Failed to download {url}: Status {response.status_code}")
        return False
        
    total_size = int(response.headers.get('content-length', 0))
    
    dest.parent.mkdir(parents=True, exist_ok=True)
    
    with open(dest, 'wb') as f, tqdm(
        desc=dest.name,
        total=total_size,
        unit='iB',
        unit_scale=True,
        unit_divisor=1024,
    ) as pbar:
        for data in response.iter_content(chunk_size=1024):
            size = f.write(data)
            pbar.update(size)
    return True

def download_vibevoice():
    """Download VibeVoice-1.5B model to ComfyUI models directory"""
    
    # Model destination (CORRECT lowercase path)
    root_dir = Path(__file__).parent.parent
    model_dir = root_dir / "ComfyUI" / "models" / "vibevoice" / "VibeVoice-1.5B"
    
    print(f"📦 Downloading VibeVoice-1.5B to: {model_dir}")
    
    # HuggingFace base URL (no subfolders)
    base_url = "https://huggingface.co/microsoft/VibeVoice-1.5B/resolve/main"
    
    # Files to download (flat structure)
    files = [
        "config.json",
        "preprocessor_config.json",
        "model.safetensors.index.json",
        "model-00001-of-00003.safetensors",
        "model-00002-of-00003.safetensors",
        "model-00003-of-00003.safetensors",
    ]
    
    print(f"\n🔄 Downloading {len(files)} files...")
    
    for file_name in files:
        url = f"{base_url}/{file_name}"
        dest = model_dir / file_name
        
        if dest.exists() and dest.stat().st_size > 0:
            print(f"✓ Already exists: {file_name}")
            continue
            
        print(f"\n⬇️  Downloading: {file_name}")
        try:
            success = download_file(url, dest)
            if not success:
                print(f"❌ Failed to download {file_name}")
                return False
        except Exception as e:
            print(f"❌ Error downloading {file_name}: {e}")
            return False
    
    print("\n✅ VibeVoice model downloaded successfully!")
    print(f"📁 Location: {model_dir}")
    return True

if __name__ == "__main__":
    download_vibevoice()
