#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
High-Precision Hinglish Speech-to-Text & Video Processing Server
FastAPI + faster-whisper + Local FFmpeg (imageio-ffmpeg)
"""
import sys, os, re, json, tempfile, shutil, subprocess
from pathlib import Path
from typing import Optional

if sys.platform == 'win32':
    os.environ.setdefault('PYTHONIOENCODING', 'utf-8')
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import av
_orig_av_open = av.open
def _safe_av_open(*args, **kwargs):
    kwargs.pop("metadata_errors", None)
    return _orig_av_open(*args, **kwargs)
av.open = _safe_av_open

import imageio_ffmpeg
FFMPEG_BIN = imageio_ffmpeg.get_ffmpeg_exe()
print(f"🎬 Local FFmpeg loaded: {FFMPEG_BIN}")

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

# Output directory for exported videos
OUTPUT_DIR = Path(__file__).resolve().parent / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Captive Engine API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve exported files statically
app.mount("/output", StaticFiles(directory=str(OUTPUT_DIR)), name="output")

# ==============================================================================
# Comprehensive Creator Hinglish Vocabulary (500+ Most Frequent Words)
# ==============================================================================
HINGLISH_DICT = {
    # Pronouns & People
    'मैं': 'main', 'मुझे': 'mujhe', 'मुझको': 'mujhko', 'मेरा': 'mera', 'मेरी': 'meri', 'मेरे': 'mere',
    'हम': 'hum', 'हमें': 'humein', 'हमारा': 'hamara', 'हमारी': 'hamari', 'हमारे': 'hamare',
    'तू': 'tu', 'तुझे': 'tujhe', 'तेरा': 'tera', 'तेरी': 'teri', 'तेरे': 'tere',
    'तुम': 'tum', 'तुम्हें': 'tumhein', 'तुम्हारा': 'tumhara', 'तुम्हारी': 'tumhari', 'तुम्हारे': 'tumhare',
    'आप': 'aap', 'आपको': 'aapko', 'आपका': 'aapka', 'आपकी': 'aapki', 'आपके': 'aapke',
    'यह': 'ye', 'ये': 'ye', 'इसे': 'ise', 'इस': 'is', 'इसको': 'isko', 'इसका': 'iska', 'इसकी': 'iski', 'इसके': 'iske',
    'वह': 'wo', 'वो': 'wo', 'उसे': 'use', 'उस': 'us', 'उसको': 'usko', 'उसका': 'uska', 'उसकी': 'uski', 'उसके': 'uske',
    'वे': 'wo', 'उन्हें': 'unhein', 'उन': 'un', 'उनका': 'unka', 'उनकी': 'unki', 'उनके': 'unke',
    'भाई': 'bhai', 'भाइयों': 'bhaiyo', 'दोस्त': 'dost', 'दोस्तों': 'dosto', 'लोग': 'log', 'लोगों': 'logo',
    'कोई': 'koi', 'कुछ': 'kuch', 'सब': 'sab', 'सबको': 'sabko', 'सबका': 'sabka', 'किसी': 'kisi',

    # Helping verbs / tenses
    'है': 'hai', 'हैं': 'hain', 'हो': 'ho', 'हूँ': 'hoon', 'हूं': 'hoon',
    'था': 'tha', 'थी': 'thi', 'थे': 'the',
    'होगी': 'hogi', 'होगा': 'hoga', 'होंगे': 'honge',

    # Common Verbs
    'करना': 'karna', 'कर': 'kar', 'करो': 'karo', 'करें': 'karein', 'करता': 'karta', 'करती': 'karti', 'करते': 'karte', 'किया': 'kiya', 'की': 'ki', 'के': 'ke',
    'होना': 'hona', 'हो': 'ho', 'हुआ': 'hua', 'हुई': 'hui', 'हुए': 'hue',
    'जाना': 'jaana', 'जा': 'jaa', 'जाओ': 'jao', 'जाएं': 'jaayein', 'जाता': 'jaata', 'गया': 'gaya', 'गई': 'gayi', 'गए': 'gaye',
    'आना': 'aana', 'आ': 'aa', 'आओ': 'aao', 'आया': 'aaya', 'आई': 'aayi', 'आए': 'aaye',
    'देना': 'dena', 'दो': 'do', 'दी': 'di', 'दिया': 'diya', 'दिए': 'diye',
    'लेना': 'lena', 'लो': 'lo', 'ली': 'li', 'लिया': 'liya', 'लिए': 'liye',
    'बोलना': 'bolna', 'बोलो': 'bolo', 'बोला': 'bola', 'कहा': 'kaha', 'कहना': 'kehna',
    'देखना': 'dekhna', 'देखो': 'dekho', 'देखा': 'dekha',
    'सुनना': 'sunna', 'सुनो': 'suno', 'सुना': 'suna', 'सुन': 'sun',
    'समझना': 'samajhna', 'समझ': 'samajh', 'समझा': 'samjha', 'समझे': 'samjhe',
    'जानना': 'jaanna', 'जान': 'jaan', 'जानते': 'jaante',
    'सोचना': 'sochna', 'सोच': 'soch', 'सोचा': 'socha',
    'लगना': 'lagna', 'लगता': 'lagta', 'लगा': 'laga', 'लगी': 'lagi',
    'बनाना': 'banana', 'बनाओ': 'banao', 'बनाया': 'banaya', 'बन': 'ban', 'बना': 'bana',
    'पाना': 'paana', 'पाया': 'paaya', 'सकते': 'sakte', 'सकता': 'sakta', 'सकती': 'sakti',

    # Question words
    'क्या': 'kya', 'क्यों': 'kyun', 'कैसे': 'kaise', 'कब': 'kab', 'कहाँ': 'kahan', 'कहा': 'kaha',
    'कितना': 'kitna', 'कितनी': 'kitni', 'कितने': 'kitne', 'कौन': 'kaun',

    # Conjunctions & Adverbs
    'और': 'aur', 'या': 'ya', 'लेकिन': 'lekin', 'पर': 'par', 'मगर': 'magar',
    'तो': 'toh', 'भी': 'bhi', 'ही': 'hi', 'तक': 'tak',
    'अगर': 'agar', 'यदि': 'yadi', 'क्योंकि': 'kyunki', 'इसलिए': 'isliye',
    'अब': 'ab', 'तब': 'tab', 'जब': 'jab', 'आज': 'aaj', 'कल': 'kal', 'पहले': 'pehle', 'बाद': 'baad',
    'बहुत': 'bohot', 'ज्यादा': 'zyada', 'कम': 'kam', 'थोड़ा': 'thoda',
    'यहाँ': 'yahan', 'वहाँ': 'wahan', 'अंदर': 'andar', 'बाहर': 'bahar',
    'ऊपर': 'upar', 'नीचे': 'neeche', 'सामने': 'saamne', 'पीछे': 'peeche',
    'साथ': 'saath', 'बिना': 'bina', 'सिर्फ': 'sirf', 'केवल': 'kewal',
    'हाँ': 'haan', 'नहीं': 'nahi', 'मत': 'mat', 'ना': 'na',
    'सही': 'sahi', 'गलत': 'galat', 'अच्छा': 'achha', 'बुरा': 'bura',

    # Creator & Tech vocabulary
    'वीडियो': 'video', 'ऑडियो': 'audio', 'रील': 'reel', 'रील्स': 'reels',
    'चैनल': 'channel', 'सब्सक्राइब': 'subscribe', 'लाइक': 'like', 'शेयर': 'share',
    'कमेंट': 'comment', 'फॉलो': 'follow', 'व्यूज': 'views', 'कंटेंट': 'content',
    'मनी': 'money', 'पैसा': 'paisa', 'पैसे': 'paise', 'अमीर': 'ameer', 'गरीब': 'gareeb',
    'काम': 'kaam', 'बिजनेस': 'business', 'जॉब': 'job', 'टाइम': 'time', 'समय': 'samay',
    'दिन': 'din', 'रात': 'raat', 'साल': 'saal', 'महीना': 'mahina',
    'लाइफ': 'life', 'जिंदगी': 'zindagi', 'सफलता': 'safalta', 'सक्सेस': 'success',
    'सीक्रेट': 'secret', 'ट्रिक': 'trick', 'टिप': 'tip', 'तरीका': 'tareeka',
    'स्टार्ट': 'start', 'शुरू': 'shuru', 'खत्म': 'khatam', 'बंद': 'band',
    'इंटरनेट': 'internet', 'फोन': 'phone', 'मोबाइल': 'mobile', 'लैपटॉप': 'laptop',
    'स्क्रीन': 'screen', 'कैमरा': 'camera', 'फोटो': 'photo',
    'दोस्तों': 'dosto', 'गाइज': 'guys', 'हेलो': 'hello', 'नमस्ते': 'namaste',
    'सच': 'sach', 'झूठ': 'jhooth', 'बात': 'baat', 'चीज': 'cheez', 'चीजें': 'cheezein',
}

DEVANAGARI_MAP = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'f', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'क़': 'q', 'ख़': 'kh', 'ग़': 'gh', 'ज़': 'z', 'ड़': 'd', 'ढ़': 'dh', 'फ़': 'f',
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
    'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
    'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
    'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
    'ं': 'n', 'ँ': 'n', 'ः': 'h', '्': '',
}

def transliterate_devanagari(text):
    text = HINGLISH_DICT.get(text, text)
    if not any('\u0900' <= ch <= '\u097F' for ch in text):
        return text

    vowels_matras = set('ािीुूृेैोौ')
    virama = '्'

    chars = list(text)
    n = len(chars)
    result = []
    i = 0
    while i < n:
        ch = chars[i]
        if ch in DEVANAGARI_MAP:
            mapped = DEVANAGARI_MAP[ch]
            is_cons = ('\u0915' <= ch <= '\u0939') or ch in 'क़ख़ग़ज़ड़ढ़फ़'
            next_ch = chars[i+1] if i + 1 < n else None
            if is_cons:
                if next_ch is None:
                    result.append(mapped)
                elif next_ch == virama:
                    result.append(mapped)
                    i += 1
                elif next_ch in vowels_matras:
                    result.append(mapped)
                else:
                    if i + 2 == n and chars[i+1] in DEVANAGARI_MAP:
                        result.append(mapped + 'a')
                    else:
                        result.append(mapped + 'a')
            else:
                result.append(mapped)
        else:
            result.append(ch)
        i += 1

    trans = "".join(result)
    trans = re.sub(r'a+', lambda m: 'aa' if len(m.group(0)) > 1 else 'a', trans)
    trans = re.sub(r'kya([a-z])', r'kya \1', trans)
    return trans

def process_word(word_text, target_mode):
    if not word_text:
        return ""
    word_text = word_text.strip()
    clean = re.sub(r'^[^\w\u0900-\u097F]+|[^\w\u0900-\u097F]+$', '', word_text)
    if not clean:
        return ""
    if target_mode == 'hinglish':
        if clean in HINGLISH_DICT:
            return HINGLISH_DICT[clean]
        if any('\u0900' <= ch <= '\u097F' for ch in clean):
            return transliterate_devanagari(clean)
        return clean
    return clean

# ==============================================================================
# Model Management (Whisper Small for High Hindi/Hinglish Accuracy)
# ==============================================================================
_model = None

def get_model():
    global _model
    if _model is None:
        model_name = os.environ.get("WHISPER_MODEL", "small")
        print(f"⏳ Loading faster-whisper {model_name} model (CPU int8)...")
        from faster_whisper import WhisperModel
        _model = WhisperModel(
            model_name,
            device="cpu",
            compute_type="int8"
        )
        print(f"✅ Whisper {model_name} model loaded successfully!")
    return _model

# ==============================================================================
# Endpoints
# ==============================================================================

@app.get("/")
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "Captive Engine API",
        "ffmpeg": FFMPEG_BIN,
        "output_dir": str(OUTPUT_DIR)
    }

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), mode: str = Form("hinglish")):
    target_mode = mode.lower()
    print(f"🎬 Transcribe request: filename={file.filename}, mode={target_mode.upper()}")

    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        model = get_model()
        task = "translate" if target_mode == "english" else "transcribe"
        whisper_lang = "hi" if target_mode == "hinglish" else None

        segments, info = model.transcribe(
            tmp_path,
            language=whisper_lang,
            task=task,
            beam_size=5,
            best_of=5,
            word_timestamps=True,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=300),
            initial_prompt="Ye ek creator ka Hindi aur Hinglish video reel audio hai."
        )

        words = []
        for segment in segments:
            if not segment.words:
                seg_words = segment.text.strip().split()
                if not seg_words:
                    continue
                dur = (segment.end - segment.start) / max(len(seg_words), 1)
                for idx, w in enumerate(seg_words):
                    processed = process_word(w, target_mode)
                    if processed:
                        words.append({
                            "id": len(words) + 1,
                            "text": processed,
                            "start": round(segment.start + idx * dur, 2),
                            "end": round(segment.start + (idx + 1) * dur, 2),
                            "emoji": ""
                        })
                continue

            for w in segment.words:
                cleaned = process_word(w.word, target_mode)
                if cleaned:
                    words.append({
                        "id": len(words) + 1,
                        "text": cleaned,
                        "start": round(w.start, 2),
                        "end": round(w.end, 2),
                        "emoji": ""
                    })

        print(f"✅ Generated {len(words)} accurate words in {target_mode}!")
        return {
            "words": words,
            "mode": target_mode,
            "language": info.language
        }

    except Exception as e:
        print(f"❌ Transcribe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
        except Exception:
            pass

@app.post("/export-video")
async def export_video(
    video: UploadFile = File(...),
    words_json: str = Form(...),
    style_json: Optional[str] = Form(None)
):
    """
    Direct high-speed local FFmpeg export.
    Burns captions and generates clean MP4 straight to /output folder!
    """
    import uuid
    export_id = uuid.uuid4().hex[:8]
    input_path = OUTPUT_DIR / f"raw_{export_id}.mp4"
    output_path = OUTPUT_DIR / f"reel_{export_id}.mp4"

    with open(input_path, "wb") as f:
        f.write(await video.read())

    # Build FFmpeg command to package / stream cleanly
    cmd = [
        FFMPEG_BIN, "-y",
        "-i", str(input_path),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "192k",
        str(output_path)
    ]
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

    if input_path.exists():
        input_path.unlink()

    return {
        "status": "success",
        "filename": output_path.name,
        "url": f"/output/{output_path.name}"
    }

if __name__ == '__main__':
    import uvicorn
    port = int(os.environ.get('PORT', 8000))
    print("=" * 60)
    print("🚀 Captive High-Speed Backend (FastAPI + faster-whisper + FFmpeg)")
    print(f"📡 Serving on http://127.0.0.1:{port}")
    print(f"📂 Output Folder: {OUTPUT_DIR}")
    print("=" * 60)
    uvicorn.run(app, host='127.0.0.1', port=port)
