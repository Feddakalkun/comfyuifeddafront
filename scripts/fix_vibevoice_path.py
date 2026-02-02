import os
from pathlib import Path
import shutil

def fix_vibevoice_path():
    root_dir = Path(__file__).parent.parent
    comfy_models = root_dir / "ComfyUI" / "models"
    
    # Path where we downloaded it
    current_path = comfy_models / "VibeVoice"
    
    # Path where VibeVoice node expects it
    target_path = comfy_models / "vibevoice"
    
    print(f"Current path exists: {current_path.exists()}")
    print(f"Target path exists: {target_path.exists()}")
    
    if current_path.exists() and not target_path.exists():
        print(f"Renaming {current_path} to {target_path}...")
        try:
            os.rename(current_path, target_path)
            print("✅ Renamed successfully!")
        except Exception as e:
            print(f"❌ Rename failed: {e}")
            
    elif current_path.exists() and target_path.exists():
         print("Both paths exist. Moving contents...")
         # Move contents from VibeVoice to vibevoice
         for item in os.listdir(current_path):
             src = current_path / item
             dst = target_path / item
             if not dst.exists():
                 shutil.move(src, dst)
                 print(f"Moved {src} to {dst}")
         
         # Remove old empty dir
         try:
             os.rmdir(current_path)
             print("Removed empty VibeVoice directory")
         except:
             pass
             
    # Also check inside the folder
    model_folder = target_path / "VibeVoice-1.5B"
    if model_folder.exists():
        print(f"✅ Model folder found: {model_folder}")
        files = os.listdir(model_folder)
        print(f"Files: {files}")
        
    else:
        print(f"❌ Model folder not found at {model_folder}")

if __name__ == "__main__":
    fix_vibevoice_path()
