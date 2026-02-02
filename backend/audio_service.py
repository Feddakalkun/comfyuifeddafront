"""
Audio Service - handles audio transcription via ComfyUI Whisper workflow
"""
import os
import json
import time
import requests
from pathlib import Path

# ComfyUI server URL
COMFYUI_URL = "http://127.0.0.1:8188"

# Paths
WORKFLOW_PATH = Path(__file__).parent / "workflows" / "audio" / "audio_caption_api.json"
TTS_WORKFLOW_PATH = Path(__file__).parent / "workflows" / "audio" / "voxcpm_tts_api.json"
TEMP_AUDIO_DIR = Path(__file__).parent.parent / "temp" / "audio"
TEMP_AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# ... (rest of imports/vars identical up to text_to_speech function) ...

def load_audio_caption_workflow():
    """Load the AUDIO CAPTION workflow (API format)"""
    with open(WORKFLOW_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_tts_workflow():
    """Load the TTS workflow (API format)"""
    with open(TTS_WORKFLOW_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

# ... (save_temp_audio, transcribe_audio, cleanup_temp_audio identical) ...

def text_to_speech(text: str, voice_style: str = "female, clear voice") -> Path:
    """
    Generate speech from text using ComfyUI VoxCPM TTS workflow
    """
    # 1. Load TTS workflow
    workflow_api = load_tts_workflow()
    
    # 2. Update text in VoxCPM Generator node (node 26)
    if "26" in workflow_api:
        workflow_api["26"]["inputs"]["text"] = text
        print(f"✅ Set TTS text: {text[:50]}...")
    
    # 3. Queue the workflow
    response = requests.post(
        f"{COMFYUI_URL}/prompt",
        json={"prompt": workflow_api, "client_id": "python-tts-service"}
    )
    
    if response.status_code != 200:
        print(f"❌ TTS Error response: {response.text}")
        response.raise_for_status()
        
    prompt_id = response.json()['prompt_id']
    print(f"✅ Queued TTS generation, prompt_id: {prompt_id}")
    
    # 4. Poll for completion and get audio file path
    max_attempts = 120  # VoxCPM might take a moment to download model first time
    for attempt in range(max_attempts):
        time.sleep(2)
        
        history_response = requests.get(f"{COMFYUI_URL}/history/{prompt_id}")
        if history_response.status_code != 200:
            continue
            
        history = history_response.json()
        
        if prompt_id in history and history[prompt_id].get('outputs'):
            outputs = history[prompt_id]['outputs']
            
            # Node 21 is SaveAudio
            if '21' in outputs:
                audio_output = outputs['21']
                
                # Get filename from SaveAudio output
                if 'audio' in audio_output and len(audio_output['audio']) > 0:
                    audio_info = audio_output['audio'][0]
                    
                    filename = audio_info.get('filename')
                    subfolder = audio_info.get('subfolder', '')
                    
                    comfyui_output_dir = Path(__file__).parent.parent / "ComfyUI" / "output"
                    audio_path = comfyui_output_dir / subfolder / filename
                    
                    if audio_path.exists():
                        print(f"✅ TTS audio generated: {audio_path}")
                        return audio_path
            
            print(f"⏳ TTS attempt {attempt + 1}/{max_attempts}...")
    
    raise Exception("TTS generation timed out")

