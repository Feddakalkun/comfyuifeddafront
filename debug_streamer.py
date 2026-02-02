import transformers
import transformers.generation
import inspect

print(f"Transformers version: {transformers.__version__}")

try:
    from transformers.generation import BaseStreamer
    print("✅ BaseStreamer imported successfully from transformers.generation")
except ImportError:
    print("❌ Failed to import BaseStreamer from transformers.generation")
    print("\nAvailable contents of transformers.generation:")
    print([x for x in dir(transformers.generation) if "Stream" in x])
    
    # Try alternate location
    try:
        from transformers.generation.streamers import BaseStreamer
        print("✅ Found BaseStreamer in transformers.generation.streamers")
    except ImportError:
        print("❌ Not found in transformers.generation.streamers either")

print("\nTrying to import Streamer via direct module path...")
try:
    import transformers.generation.streamers as streamers
    print(f"Streamers module contents: {dir(streamers)}")
except Exception as e:
    print(f"Failed to import streamers module: {e}")
