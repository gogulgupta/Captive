import sys, os, tempfile, shutil
from pathlib import Path
from typing import List, Dict, Any, Optional

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

if sys.platform == 'win32':
    os.environ.setdefault('PYTHONIOENCODING', 'utf-8')
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# PyAV monkey-patch for older metadata_errors
import av
_orig_av_open = av.open
def _safe_av_open(*args, **kwargs):
    kwargs.pop("metadata_errors", None)
    return _orig_av_open(*args, **kwargs)
av.open = _safe_av_open

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from backend.services.audio_extractor import extract_audio
from backend.services.transcriber import transcribe_audio_words
from backend.services.exporter import burn_captions_to_video

# Setup local output directory
BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Captive Offline Engine", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")

@app.get("/")
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "engine": "Local Offline Faster-Whisper + FFmpeg",
        "supported_modes": ["hinglish", "english"],
        "output_dir": str(OUTPUT_DIR)
    }

@app.post("/transcribe")
async def transcribe_endpoint(
    file: Optional[UploadFile] = File(None),
    video_path: Optional[str] = Form(None),
    mode: str = Form("hinglish")
):
    """
    POST /transcribe
    Input: Uploaded video file OR local file path
    Output: strictly [{"word": "nahi", "start": 1.2, "end": 1.5}, ...]
    """
    temp_video_to_cleanup = None
    target_video_file = None

    if video_path and os.path.exists(video_path):
        target_video_file = video_path
    elif file is not None:
        suffix = Path(file.filename).suffix or ".mp4"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_vid:
            tmp_vid.write(await file.read())
            target_video_file = tmp_vid.name
            temp_video_to_cleanup = target_video_file
    else:
        raise HTTPException(status_code=400, detail="Provide either 'file' upload or valid 'video_path'.")

    extracted_audio = None
    try:
        # Step 1: Extract 16kHz mono WAV using local FFmpeg
        print(f"🎬 [Layer 1] Extracting audio from {target_video_file}...")
        extracted_audio = extract_audio(target_video_file)

        # Step 2: Transcribe with word-level forced alignment & Hinglish rules
        print(f"🤖 [Layer 1] Transcribing audio with word timestamps (mode={mode})...")
        words = transcribe_audio_words(extracted_audio, mode=mode)
        print(f"✅ [Layer 1] Generated {len(words)} aligned words!")

        # Strictly follows schema: [{"word": "str", "start": float, "end": float}]
        return words

    except Exception as e:
        print(f"❌ [Layer 1] Transcribe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if extracted_audio and os.path.exists(extracted_audio):
            try:
                os.unlink(extracted_audio)
            except Exception:
                pass
        if temp_video_to_cleanup and os.path.exists(temp_video_to_cleanup):
            try:
                os.unlink(temp_video_to_cleanup)
            except Exception:
                pass

@app.post("/export")
async def export_video_endpoint(
    video: UploadFile = File(...),
    words_json: str = Form(...),
    preset_json: Optional[str] = Form(None)
):
    """
    POST /export (Layer 3 Final Video Exporter)
    Burns kinetic word-by-word captions into local MP4 via FFmpeg hardware encoder.
    Saves directly to /output folder and returns download path.
    """
    import uuid
    export_id = uuid.uuid4().hex[:8]
    input_path = OUTPUT_DIR / f"raw_{export_id}.mp4"
    output_path = OUTPUT_DIR / f"captioned_reel_{export_id}.mp4"

    with open(input_path, "wb") as f:
        f.write(await video.read())

    words_list = json.loads(words_json)
    preset_dict = json.loads(preset_json) if preset_json else {
        "fontFamily": "Impact",
        "fontSize": 48,
        "positionY": 75,
        "wordsPerLine": 3
    }

    try:
        burn_captions_to_video(
            str(input_path),
            words_list,
            preset_dict,
            str(output_path)
        )
        return {
            "status": "success",
            "filename": output_path.name,
            "url": f"/output/{output_path.name}"
        }
    finally:
        if input_path.exists():
            input_path.unlink()

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('PORT', 8000))
    print("=" * 60)
    print("🎬 Layer 1 Backend Ready — Serving on http://127.0.0.1:8000")
    print("=" * 60)
    uvicorn.run(app, host='127.0.0.1', port=port)
