"""
Download Qwen Tokenizer for VibeVoice
"""
import os
from pathlib import Path
import requests
from tqdm import tqdm

def download_file(url, dest):
    response = requests.get(url, stream=True)
    if response.status_code != 200:
        print(f"❌ Failed to download {url}: Status {response.status_code}")
        return False
    total_size = int(response.headers.get('content-length', 0))
    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, 'wb') as f, tqdm(desc=dest.name, total=total_size, unit='iB', unit_scale=True) as pbar:
        for data in response.iter_content(chunk_size=1024):
            size = f.write(data)
            pbar.update(size)
    return True

def download_tokenizer():
    root_dir = Path(__file__).parent.parent
    tokenizer_dir = root_dir / "ComfyUI" / "models" / "tokenizer"
    
    print(f"📦 Downloading Qwen Tokenizer to: {tokenizer_dir}")
    
    base_url = "https://huggingface.co/Qwen/Qwen2.5-1.5B/resolve/main"
    files = ["tokenizer_config.json", "vocab.json", "merges.txt", "tokenizer.json"]
    
    for file_name in files:
        url = f"{base_url}/{file_name}"
        dest = tokenizer_dir / file_name
        
        if dest.exists() and dest.stat().st_size > 0:
            print(f"✓ Already exists: {file_name}")
            continue
            
        print(f"\n⬇️  Downloading: {file_name}")
        download_file(url, dest)
    
    print("\n✅ Tokenizer downloaded successfully!")

if __name__ == "__main__":
    download_tokenizer()
