import sys
import os

# Add VibeVoice node path content to sys.path
vibevoice_node_path = os.path.join(os.getcwd(), "ComfyUI", "custom_nodes", "VibeVoice-ComfyUI")
sys.path.append(vibevoice_node_path)
vvembed_path = os.path.join(vibevoice_node_path, "vvembed")
sys.path.insert(0, vvembed_path)

print(f"Path added: {vvembed_path}")

try:
    import transformers
    print(f"Transformers version: {transformers.__version__}")
    
    from modular.modeling_vibevoice_inference import VibeVoiceForConditionalGenerationInference
    print("✅ Import successful!")
except Exception as e:
    print(f"❌ Import failed: {e}")
    import traceback
    traceback.print_exc()
