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
import json
import urllib.request
import urllib.error
import requests

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],  # Vite dev server
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


# === RUNPOD CLOUD INTEGRATION ===

class RunPodFileDesc(BaseModel):
    filename: str
    subfolder: str = ""
    type: str = "output"

class RunPodAnimateRequest(BaseModel):
    files: list[RunPodFileDesc]
    runpod_url: str
    runpod_token: str = ""

@app.post("/api/runpod/animate")
async def trigger_runpod_animation(req: RunPodAnimateRequest):
    """
    Sends selected files to a RunPod endpoint to generate a Wan2.1 video loop
    """
    try:
        import copy
        comfy_dir = Path(__file__).parent.parent / "ComfyUI"
        
        # 1. Resolve local file paths
        local_files = []
        for fdesc in req.files:
            base_dir = comfy_dir / fdesc.type
            if fdesc.subfolder:
                fpath = base_dir / fdesc.subfolder / fdesc.filename
            else:
                fpath = base_dir / fdesc.filename
            if fpath.exists():
                local_files.append(fpath)
                
        if not local_files:
            raise HTTPException(status_code=400, detail="No valid files selected on disk.")
            
        # 2. Upload images to RunPod
        upload_url = req.runpod_url.replace("/prompt", "/upload/image")
        remote_filenames = []
        
        headers = {}
        if req.runpod_token:
            headers["Authorization"] = f"Bearer {req.runpod_token}"
            
        print(f"☁️ Uploading {len(local_files)} images to RunPod...")
        for fpath in local_files:
            with open(fpath, 'rb') as f:
                res = requests.post(upload_url, headers=headers, files={'image': (fpath.name, f, 'image/png')})
                res.raise_for_status()
                remote_name = res.json().get("name")
                if remote_name:
                    remote_filenames.append(remote_name)
                    
        if not remote_filenames:
            raise HTTPException(status_code=500, detail="Failed to upload any images to RunPod.")
            
        # 3. Load Workflow
        workflow_path = Path(__file__).parent / "workflows" / "videos" / "final_runpod_prompt.json"
        if not workflow_path.exists():
            raise HTTPException(status_code=500, detail="RunPod workflow JSON not found on server.")
            
        with open(workflow_path, "r", encoding="utf-8") as wf_file:
            wf = json.load(wf_file)
            
        # 4. Inject Images (Auto-Loop if we have fewer images than LoadImage nodes)
        load_image_nodes = [n_id for n_id, data in wf.items() if isinstance(data, dict) and data.get("class_type") == "LoadImage"]
        load_image_nodes.sort()
        
        for i, node_id in enumerate(load_image_nodes):
            if i < 6:
                safe_index = i % len(remote_filenames)
                wf[node_id]["inputs"]["image"] = remote_filenames[safe_index]
                
        # (Optional) Inject default RunPod limits or tokens here. Let's send it!
        payload = {"prompt": wf}
        
        print(f"☁️ Sending job to {req.runpod_url}")
        req_kwargs = {
            "json": payload,
            "headers": {
                "Content-Type": "application/json"
            }
        }
        if req.runpod_token:
            req_kwargs["headers"]["Authorization"] = f"Bearer {req.runpod_token}"
            
        job_res = requests.post(req.runpod_url, **req_kwargs)
        job_res.raise_for_status()
        
        job_data = job_res.json()
        return {"success": True, "prompt_id": job_data.get("prompt_id", "UNKNOWN")}
        
    except requests.exceptions.HTTPError as he:
        print(f"RunPod HTTP Error: {he.response.text}")
        raise HTTPException(status_code=he.response.status_code, detail=f"RunPod Endpoint Error: {he.response.text}")
    except Exception as e:
        print(f"❌ RunPod Integration Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === FILE MANAGEMENT ENDPOINTS ===

@app.get("/api/files/list")
async def list_output_files():
    """
    List all media files in ComfyUI output directory by scanning filesystem
    Returns files with their metadata
    """
    try:
        comfy_output = Path(__file__).parent.parent / "ComfyUI" / "output"
        files_list = []
        
        # Scan all files recursively
        for file_path in comfy_output.rglob("*"):
            if file_path.is_file() and file_path.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.webm']:
                # Get relative path from output directory
                rel_path = file_path.relative_to(comfy_output)
                
                # Extract subfolder and model info
                parts = str(rel_path.parent).split('\\')
                model = parts[0] if len(parts) > 0 and parts[0] != '.' else 'unknown'
                date_folder = parts[1] if len(parts) > 1 else 'unknown'
                subfolder = str(rel_path.parent).replace('\\', '/')
                
                # Get file stats
                stat = file_path.stat()
                
                files_list.append({
                    "filename": file_path.name,
                    "subfolder": subfolder,
                    "type": "output",
                    "model": model,
                    "dateFolder": date_folder,
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                    "url": f"http://127.0.0.1:8188/view?filename={file_path.name}&subfolder={subfolder}&type=output"
                })
        
        # Sort by modified time (newest first)
        files_list.sort(key=lambda x: x["modified"], reverse=True)
        
        return {
            "success": True,
            "count": len(files_list),
            "files": files_list
        }
        
    except Exception as e:
        print(f"❌ List files error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



class DeleteFileRequest(BaseModel):
    filename: str
    subfolder: str = ""
    type: str = "output"  # 'output', 'input', or 'temp'

@app.post("/api/files/delete")
async def delete_file(request: DeleteFileRequest):
    """
    Delete a file from ComfyUI output directory
    
    Args:
        filename: Name of file to delete
        subfolder: Subfolder within output (e.g., "z-image/2026-02-07")
        type: 'output', 'input', or 'temp'
    
    Returns:
        Success message
    """
    try:
        # Construct full path
        comfy_dir = Path(__file__).parent.parent / "ComfyUI"
        base_dir = comfy_dir / request.type
        
        if request.subfolder:
            file_path = base_dir / request.subfolder / request.filename
        else:
            file_path = base_dir / request.filename
        
        # Security check - ensure path is within ComfyUI directory
        if not str(file_path.resolve()).startswith(str(comfy_dir.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete file
        if file_path.exists():
            file_path.unlink()
            print(f"✅ Deleted: {file_path}")
            return {"success": True, "message": f"Deleted {request.filename}"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
            
    except HTTPException:
        raise  # Re-raise HTTPExceptions as-is
    except Exception as e:
        print(f"❌ Delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/files/cleanup")
async def cleanup_orphaned_files():
    """
    Clean up orphaned files in output directory that are not in ComfyUI history
    Returns list of deleted files
    """
    try:
        import requests
        
        # Get ComfyUI history
        history_response = requests.get("http://127.0.0.1:8188/history")
        history = history_response.json()
        
        # Extract all valid filenames from history
        valid_files = set()
        for prompt_data in history.values():
            if prompt_data.get("outputs"):
                for output in prompt_data["outputs"].values():
                    if output.get("images"):
                        for img in output["images"]:
                            valid_files.add(img["filename"])
                    if output.get("gifs"):
                        for gif in output["gifs"]:
                            valid_files.add(gif["filename"])
                    if output.get("videos"):
                        for vid in output["videos"]:
                            valid_files.add(vid["filename"])
        
        # Scan output directory
        comfy_output = Path(__file__).parent.parent / "ComfyUI" / "output"
        deleted_files = []
        
        for file_path in comfy_output.rglob("*"):
            if file_path.is_file() and file_path.suffix in ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4']:
                if file_path.name not in valid_files:
                    file_path.unlink()
                    deleted_files.append(str(file_path.relative_to(comfy_output)))
                    print(f"🗑️ Cleaned up: {file_path.name}")
        
        return {
            "success": True,
            "deleted_count": len(deleted_files),
            "deleted_files": deleted_files
        }
        
    except Exception as e:
        print(f"❌ Cleanup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/lora/descriptions")
async def get_lora_descriptions():
    """
    Scan LoRA folders for description.txt files.
    Returns a map of { "lora_relative_path.safetensors": "description text" }
    Keys match the format returned by ComfyUI's object_info API.
    """
    try:
        loras_dir = Path(__file__).parent.parent / "ComfyUI" / "models" / "loras"
        descriptions = {}

        for desc_file in loras_dir.rglob("description.txt"):
            text = desc_file.read_text(encoding="utf-8").strip()
            if not text:
                continue

            # Find all .safetensors files in the same directory
            for safetensor in desc_file.parent.glob("*.safetensors"):
                # Key = relative path from loras dir, using backslashes (Windows ComfyUI format)
                rel_path = str(safetensor.relative_to(loras_dir))
                descriptions[rel_path] = text

        return {"success": True, "descriptions": descriptions}

    except Exception as e:
        print(f"Error scanning LoRA descriptions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    print("🎤 Audio Transcription Server starting on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
