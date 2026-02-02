import torch
from transformers import AutoModel, AutoConfig
from pathlib import Path
import os
import sys

# Add vvembed path
root = Path(__file__).parent
vvembed_path = root / "ComfyUI" / "custom_nodes" / "VibeVoice-ComfyUI" / "vvembed"
sys.path.insert(0, str(vvembed_path))

model_path = root / "ComfyUI" / "models" / "vibevoice" / "VibeVoice-1.5B"

print(f"Loading model from {model_path}...")
print(f"Directory contents: {os.listdir(model_path)}")

try:
    # Try loading config first
    config = AutoConfig.from_pretrained(model_path, trust_remote_code=True)
    print("✅ Config loaded successfully")
    
    # Try importing VibeVoice class
    from modular.modeling_vibevoice_inference import VibeVoiceForConditionalGenerationInference
    
    print("Attempting to load model weights (cpu)...")
    model = VibeVoiceForConditionalGenerationInference.from_pretrained(
        model_path,
        config=config,
        trust_remote_code=True,
        local_files_only=True
    )
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Load failed: {e}")
    import traceback
    traceback.print_exc()

