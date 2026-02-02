import shutil
import os
from pathlib import Path

def setup_audio_files():
    # Source
    src_path = Path(r"h:\comfyfront\assets\audio-tts\charlotte\charlotte.wav")
    
    # Dest
    dest_dir = Path(r"h:\comfyfront\ComfyUI\input")
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / "charlotte.wav"
    
    # Copy
    print(f"Copying {src_path} to {dest_path}")
    shutil.copy2(src_path, dest_path)
    
    # Delete trash
    trash_path = dest_dir / "reference_voice.wav"
    if trash_path.exists():
        print(f"Deleting {trash_path}")
        trash_path.unlink()

if __name__ == "__main__":
    setup_audio_files()
