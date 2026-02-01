"""
LoRA Downloader for ComfyFront
Downloads character LoRAs from Google Drive folders
Places them in ComfyUI/models/loras/
"""

import os
import sys
import re
from pathlib import Path

def extract_folder_id(url):
    """Extract Google Drive folder ID from URL"""
    match = re.search(r'/folders/([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)
    return None

def download_lora_folder(drive_url, base_dir):
    """Download entire Google Drive folder"""
    folder_id = extract_folder_id(drive_url)
    if not folder_id:
        print(f"❌ Invalid Google Drive URL: {drive_url}")
        return False
    
    print(f"\n📥 Downloading folder: {folder_id}")
    print(f"📂 Destination: {base_dir}")
    
    try:
        import gdown
        
        # Download entire folder
        gdown.download_folder(
            id=folder_id,
            output=str(base_dir),
            quiet=False,
            use_cookies=False
        )
        
        print(f"✅ Downloaded successfully!")
        return True
        
    except ImportError:
        print("❌ gdown not installed!")
        print("Installing gdown...")
        os.system(f"{sys.executable} -m pip install gdown")
        print("Please run the script again.")
        return False
    except Exception as e:
        print(f"❌ Error downloading: {e}")
        return False

def main():
    # Base directory
    script_dir = Path(__file__).parent.parent
    loras_dir = script_dir / "ComfyUI" / "models" / "loras"
    
    # Create directory if it doesn't exist
    loras_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("  ComfyFront LoRA Downloader")
    print("=" * 60)
    print(f"\n📂 LoRAs will be saved to: {loras_dir}\n")
    
    # List of Google Drive folder URLs
    lora_folders = [
        # Add your Google Drive folder URLs here
        "https://drive.google.com/drive/folders/1l22hBU6nJfM2U0kVryUTvyO5AhafNrbJ?usp=sharing",
        # Add more as needed:
        # "https://drive.google.com/drive/folders/YOUR_FOLDER_ID",
    ]
    
    if not lora_folders or lora_folders[0].startswith("https://drive.google.com/drive/folders/YOUR"):
        print("⚠️  No LoRA folders configured!")
        print("\nEdit this script and add your Google Drive URLs to the 'lora_folders' list.")
        print("\nExample:")
        print('lora_folders = [')
        print('    "https://drive.google.com/drive/folders/1l22hBU6nJfM2U0kVryUTvyO5AhafNrbJ",')
        print('    "https://drive.google.com/drive/folders/ANOTHER_FOLDER_ID",')
        print(']')
        input("\nPress Enter to exit...")
        return
    
    # Download each folder
    success_count = 0
    for url in lora_folders:
        if download_lora_folder(url, loras_dir):
            success_count += 1
    
    print("\n" + "=" * 60)
    print(f"✅ Downloaded {success_count}/{len(lora_folders)} folders successfully!")
    print("=" * 60)
    print(f"\n📂 LoRAs saved to: {loras_dir}")
    
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()
