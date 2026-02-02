import os
import json
from pathlib import Path

def check_files():
    model_dir = Path(r"H:\comfyfront\ComfyUI\models\vibevoice\VibeVoice-1.5B")
    
    print(f"Checking directory: {model_dir}")
    if not model_dir.exists():
        print("❌ Directory does not exist!")
        return

    files = os.listdir(model_dir)
    print(f"Files found ({len(files)}):")
    for f in sorted(files):
        p = model_dir / f
        size = p.stat().st_size
        print(f" - {f} ({size} bytes)")
        
        if size == 0:
            print("  ⚠️ WARNING: File is empty!")
            
        if f == "config.json":
            try:
                with open(p, 'r') as cf:
                    print(f"  Content preview: {cf.read(100)}...")
            except Exception as e:
                print(f"  ❌ Error reading file: {e}")

if __name__ == "__main__":
    check_files()
