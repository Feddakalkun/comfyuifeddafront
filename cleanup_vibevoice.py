import os
from pathlib import Path
import shutil

def cleanup_and_download():
    # 1. Cleanup
    target_dir = Path(r"H:\comfyfront\ComfyUI\models\vibevoice\VibeVoice-1.5B")
    if target_dir.exists():
        print(f"Cleaning directory: {target_dir}")
        shutil.rmtree(target_dir)
        target_dir.mkdir(parents=True, exist_ok=True)
    else:
        target_dir.mkdir(parents=True, exist_ok=True)

    print("Cleanup complete. Ready for download.")

if __name__ == "__main__":
    cleanup_and_download()
