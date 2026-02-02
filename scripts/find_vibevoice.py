import os
from pathlib import Path

def find_files():
    root = Path(__file__).parent.parent / "ComfyUI" / "models"
    print(f"Searching in {root}")
    
    for root, dirs, files in os.walk(root):
        for file in files:
            if "model-00001" in file:
                print(f"FOUND: {os.path.join(root, file)}")

if __name__ == "__main__":
    find_files()
