import os
from pathlib import Path
import shutil

def move_files():
    root_dir = Path(__file__).parent.parent
    comfy_models = root_dir / "ComfyUI" / "models"
    
    # Wrong location
    source_dir = comfy_models / "models" / "VibeVoice"
    
    # Correct location
    target_dir = comfy_models / "vibevoice"
    
    print(f"Source: {source_dir}")
    print(f"Target: {target_dir}")
    
    if source_dir.exists():
        print("Found source files!")
        
        # Ensure target 'vibevoice' exists
        target_dir.mkdir(exist_ok=True)
        
        # Move 'VibeVoice-1.5B' folder
        model_folder = source_dir / "VibeVoice-1.5B"
        if model_folder.exists():
            target_model_folder = target_dir / "VibeVoice-1.5B"
            
            # If target exists, merge/overwrite? Better to just rename if target doesn't exist
            if not target_model_folder.exists():
                print(f"Moving {model_folder} to {target_model_folder}")
                shutil.move(str(model_folder), str(target_model_folder))
            else:
                print(f"Target folder {target_model_folder} already exists. Moving contents...")
                for item in os.listdir(model_folder):
                    shutil.move(str(model_folder / item), str(target_model_folder / item))
                    
            print("✅ Moved successfully!")
            
            # Cleanup output dir from weird safetensors folder name seen in logs
            # It seemed like the safetensors file was actually a folder?
            # logs said: ...\model-00001-of-00003.safetensors\model-00001-of-00003.safetensors
            # Let's verify the result structure
            
    else:
        print("❌ Source directory not found. Already moved?")
        
    # Verify final structure
    result_path = target_dir / "VibeVoice-1.5B"
    if result_path.exists():
        files = os.listdir(result_path)
        print(f"\nFinal files in {result_path}:")
        for f in files:
            print(f"  - {f}")
            
if __name__ == "__main__":
    move_files()
