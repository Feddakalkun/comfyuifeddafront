"""
Simple FastAPI server for audio transcription
Runs on port 8000
"""
import sys
from pathlib import Path

# Add backend directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
from audio_service import transcribe_audio, save_temp_audio, cleanup_temp_audio, text_to_speech
from lipsync_service import generate_lipsync
from pathlib import Path
from pydantic import BaseModel

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/audio/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    """
    Transcribe audio using ComfyUI Whisper workflow
   
    Args:
        audio: Audio file (webm, mp3, wav, etc.)
    
    Returns:
        JSON with transcribed text
    """
    temp_path = None
    try:
        # Save uploaded file
        audio_data = await audio.read()
        temp_path = save_temp_audio(audio_data, audio.filename or "recording.webm")
        
        # Transcribe
        text = transcribe_audio(temp_path)
        
        return {"text": text, "success": True}
        
    except Exception as e:
        print(f"❌ Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup temp file
        if temp_path:
            cleanup_temp_audio(temp_path)


# Request models
class TTSRequest(BaseModel):
    text: str
    voice_style: str = "female, clear voice"


@app.post("/api/audio/tts")
async def generate_speech(request: TTSRequest):
    """
    Generate speech from text using ComfyUI Qwen TTS workflow
    
    Args:
        text: Text to convert to speech
        voice_style: Voice style description
    
    Returns:
        Audio file
    """
    try:
        # Generate TTS
        audio_path = text_to_speech(request.text, request.voice_style)
        
        # Return audio file
        return FileResponse(
            path=str(audio_path),
            media_type="audio/flac",
            filename=f"tts_{audio_path.name}"
        )
        
    except Exception as e:
        print(f"❌ TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/api/video/lipsync")
async def generate_lipsync_video(
    image: UploadFile = File(...),
    audio: UploadFile = File(...),
    resolution: int = Form(512),
    seed: int = Form(-1),
    prompt: str = Form("woman talking"),
    steps: int = Form(15)
):
    """
    Generate LipSync video from Image + Audio
    """
    image_path = None
    audio_path = None
    try:
        # Save temp files
        image_data = await image.read()
        audio_data = await audio.read()
        
        # Allow png/jpg extensions
        img_ext = Path(image.filename).suffix if image.filename else ".png"
        aud_ext = Path(audio.filename).suffix if audio.filename else ".wav"
        
        image_path = save_temp_audio(image_data, f"temp_face{img_ext}")
        audio_path = save_temp_audio(audio_data, f"temp_voice{aud_ext}")
        
        # Generate
        video_path = generate_lipsync(
            image_path=image_path,
            audio_path=audio_path,
            resolution=resolution,
            seed=seed,
            steps=steps,
            prompt=prompt
        )
        
        return FileResponse(
            path=str(video_path),
            media_type="video/mp4",
            filename=video_path.name
        )
        
    except Exception as e:
        print(f"❌ LipSync error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}


if __name__ == "__main__":
    print("🎤 Audio Transcription Server starting on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
