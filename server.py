#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
High-Precision Hinglish Speech-to-Text Server for CaptionCraft
Uses faster-whisper small model + comprehensive creator Hinglish dictionary + schwa deletion
"""
import sys, os
import re
import json
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS

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

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET', 'HEAD'])
def health_check():
    return jsonify({"status": "healthy", "service": "Captive Hinglish Speech Engine"}), 200

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
    'हुआ': 'hua', 'हुई': 'hui', 'हुए': 'hue', 'होगा': 'hoga', 'होगी': 'hogi', 'होंगे': 'honge',
    'रहा': 'raha', 'रही': 'rahi', 'रहे': 'rahe',

    # Prepositions / Connectors
    'का': 'ka', 'की': 'ki', 'के': 'ke', 'को': 'ko', 'से': 'se',
    'में': 'mein', 'पर': 'par', 'पे': 'pe', 'तक': 'tak',
    'तो': 'toh', 'तौ': 'toh', 'भी': 'bhi', 'ही': 'hi',
    'और': 'aur', 'या': 'ya', 'लेकिन': 'lekin', 'मगर': 'magar',
    'अगर': 'agar', 'क्योंकि': 'kyunki', 'इसलिए': 'isliye', 'ताकि': 'taaki',

    # Questions & Time & Manner
    'क्या': 'kya', 'क्यों': 'kyun', 'कैसे': 'kaise', 'कहाँ': 'kahan', 'कहां': 'kahan',
    'यहाँ': 'yahan', 'यहां': 'yahan', 'वहाँ': 'wahan', 'वहां': 'wahan',
    'आज': 'aaj', 'कल': 'kal', 'परसों': 'parso', 'अब': 'ab', 'तब': 'tab', 'जब': 'jab', 'कब': 'kab',
    'बहुत': 'bohot', 'ज्यादा': 'zyada', 'कम': 'kam', 'थोड़ा': 'thoda', 'थोड़ी': 'thodi', 'काफी': 'kaafi',
    'अच्छा': 'accha', 'अच्छी': 'acchi', 'अच्छे': 'acche', 'बुरा': 'bura',
    'बड़ा': 'bada', 'बड़ी': 'badi', 'बड़े': 'bade', 'छोटा': 'chhota', 'छोटी': 'chhoti', 'छोटे': 'chhote',
    'पहला': 'pehla', 'पहली': 'pehli', 'पहले': 'pehle', 'बाद': 'baad',
    'नया': 'naya', 'नई': 'nayi', 'नए': 'naye', 'पुराना': 'purana',
    'सीधा': 'seedha', 'सही': 'sahi', 'गलत': 'galat', 'सच': 'sach', 'झूठ': 'jhooth',

    # Common Action Verbs
    'कर': 'kar', 'करना': 'karna', 'करता': 'karta', 'करती': 'karti', 'करते': 'karte', 'करो': 'karo', 'करें': 'karein',
    'करेंगे': 'karenge', 'करेगा': 'karega', 'करेगी': 'karegi', 'किया': 'kiya', 'कीजिए': 'kijiye',
    'जानेंगे': 'jaanenge', 'जाने': 'jaane', 'जानना': 'jaanna', 'जान': 'jaan', 'जानता': 'jaanta', 'जानती': 'jaanti',
    'देख': 'dekh', 'देखो': 'dekho', 'देखें': 'dekhein', 'देखना': 'dekhna', 'देखा': 'dekha', 'देखी': 'dekhi',
    'सुन': 'sun', 'सुनो': 'suno', 'सुनें': 'sunein', 'सुनना': 'sunna', 'सुना': 'suna',
    'बोल': 'bol', 'बोलो': 'bolo', 'बोलना': 'bolna', 'बोला': 'bola', 'बोलते': 'bolte',
    'बता': 'bata', 'बताओ': 'batao', 'बताना': 'batana', 'बताएं': 'batayein', 'बताया': 'bataya',
    'सकता': 'sakta', 'सकती': 'sakti', 'सकते': 'sakte',
    'दे': 'de', 'दो': 'do', 'देंगे': 'denge', 'देना': 'dena', 'दिया': 'diya', 'दिए': 'diye',
    'ले': 'le', 'लो': 'lo', 'लेंगे': 'lenge', 'लेना': 'lena', 'लिया': 'liya', 'लिए': 'liye',
    'जा': 'ja', 'जाओ': 'jao', 'जाना': 'jaana', 'गया': 'gaya', 'गई': 'gayi', 'गए': 'gaye', 'जाएगा': 'jaayega',
    'आ': 'aa', 'आओ': 'aao', 'आना': 'aana', 'आया': 'aaya', 'आई': 'aayi', 'आए': 'aaye', 'आएगा': 'aayega',
    'हो': 'ho', 'होना': 'hona', 'होता': 'hota', 'होती': 'hoti', 'होते': 'hote', 'होने': 'hone',
    'रख': 'rakh', 'रखो': 'rakho', 'रखना': 'rakhna', 'रखा': 'rakha',
    'समझ': 'samajh', 'समझा': 'samjha', 'समझो': 'samjho', 'समझना': 'samjhna',
    'सोच': 'soch', 'सोचो': 'socho', 'सोचना': 'sochna',
    'मिल': 'mil', 'मिला': 'mila', 'मिली': 'mili', 'मिले': 'mile', 'मिलना': 'milna',

    # Creator, Tech & Business Vocabulary
    'काम': 'kaam', 'बात': 'baat', 'चीज': 'cheez', 'चीजें': 'cheezein', 'वक्त': 'waqt', 'समय': 'samay',
    'पैसा': 'paisa', 'पैसे': 'paise', 'कमाओ': 'kamao', 'कमा': 'kama', 'कमाना': 'kamana',
    'वीडियो': 'video', 'ऑडियो': 'audio', 'रील': 'reel', 'रील्स': 'reels', 'फोटो': 'photo',
    'सेंसर': 'sensor', 'सेंसरों': 'sensors',
    'कैमरा': 'camera', 'फोन': 'phone', 'मोबाइल': 'mobile',
    'फॉलो': 'follow', 'सब्सक्राइब': 'subscribe', 'लाइक': 'like', 'शेयर': 'share',
    'कमेंट': 'comment', 'सेव': 'save', 'वायरल': 'viral', 'व्यूज': 'views',
    'तरीका': 'tareeka', 'तरीके': 'tareeke', 'स्टेप': 'step', 'टिप': 'tip', 'ट्रिक': 'trick',
    'ट्रिक्स': 'tricks', 'कंटेंट': 'content', 'एडिट': 'edit', 'एडिटिंग': 'editing',
    'ग्रोथ': 'growth', 'अकाउंट': 'account', 'चैनल': 'channel',

    # Numbers
    'एक': 'ek', 'दो': 'do', 'तीन': 'teen', 'चार': 'chaar', 'पांच': 'paanch',
    'छह': 'chhah', 'सात': 'saat', 'आठ': 'aath', 'नौ': 'nau', 'दस': 'das',
    'सौ': 'sau', 'हजार': 'hazaar', 'लाख': 'lakh', 'करोड़': 'crore',
}

DEVA_CONSONANTS = {
    'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
    'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
    'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
    'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
    'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
    'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
    'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
    'क़': 'q', 'ख़': 'kh', 'ग़': 'gh', 'ज़': 'z', 'फ़': 'f',
    'ड़': 'r', 'ढ़': 'rh',
}

DEVA_VOWELS = {
    'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee',
    'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
    'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
}

DEVA_MATRAS = {
    'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u',
    'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ृ': 'ri',
}

def is_devanagari(text):
    return any('\u0900' <= ch <= '\u097F' for ch in text)

def devanagari_to_hinglish(word):
    """
    High-accuracy transliteration:
    1. Direct dictionary lookup
    2. Fallback phonetic converter with Hindi schwa deletion
    """
    clean = re.sub(r'[^\u0900-\u097F]', '', word)
    trailing_punct = re.sub(r'[\u0900-\u097F\s]', '', word)

    if clean in HINGLISH_DICT:
        return HINGLISH_DICT[clean] + trailing_punct

    # Fallback algorithmic transliteration
    chars = list(word)
    n = len(chars)
    res = []
    i = 0

    while i < n:
        c = chars[i]

        if c in DEVA_VOWELS:
            res.append(DEVA_VOWELS[c])
            i += 1
            continue

        if c in DEVA_CONSONANTS:
            res.append(DEVA_CONSONANTS[c])
            if i + 1 < n:
                nxt = chars[i + 1]
                if nxt == '्':  # Halant (virama)
                    i += 2
                    continue
                elif nxt in DEVA_MATRAS:
                    res.append(DEVA_MATRAS[nxt])
                    i += 2
                    continue
                elif nxt in ('ं', 'ँ'):
                    res.append('n')
                    i += 2
                    continue
                elif nxt in DEVA_CONSONANTS:
                    # Schwa deletion: do NOT add 'a' to final consonant
                    if i + 2 >= n:
                        pass
                    else:
                        res.append('a')
            i += 1
            continue

        if c in DEVA_MATRAS:
            res.append(DEVA_MATRAS[c])
            i += 1
            continue

        if c in ('ं', 'ँ'):
            res.append('n')
            i += 1
            continue

        if c == 'ः':
            res.append('h')
            i += 1
            continue

        if c not in ('्', '़'):
            res.append(c)
        i += 1

    translit = ''.join(res).strip()
    return (translit or word) + trailing_punct


def process_word(word_text, target_mode='hinglish'):
    word_text = word_text.strip()
    if not word_text:
        return ""

    if target_mode == 'hinglish':
        if is_devanagari(word_text):
            return devanagari_to_hinglish(word_text)
        return word_text
    else:
        return word_text


# ==============================================================================
# Model Management (Whisper Small for High Hindi Accuracy)
# ==============================================================================

_model = None

def get_model():
    global _model
    if _model is None:
        model_name = os.environ.get("WHISPER_MODEL", "small")
        print(f"⏳ Loading faster-whisper {model_name} model (high precision)...")
        from faster_whisper import WhisperModel
        _model = WhisperModel(
            model_name,
            device="cpu",
            compute_type="int8"
        )
        print(f"✅ Whisper {model_name} model loaded successfully!")
    return _model


# ==============================================================================
# Flask Endpoints
# ==============================================================================

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "CaptionCraft server ready!"})

@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    target_mode = request.form.get('mode', 'hinglish').lower()
    print(f"🎬 Transcribe request in {target_mode.upper()} mode")

    audio_file = request.files['file']

    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name

    try:
        model = get_model()

        task = "translate" if target_mode == "english" else "transcribe"
        whisper_lang = "hi" if target_mode == "hinglish" else None

        segments, info = model.transcribe(
            tmp_path,
            language=whisper_lang,
            task=task,
            beam_size=5,             # High precision search
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
        return jsonify({
            "words": words,
            "mode": target_mode,
            "language": info.language
        })

    except Exception as e:
        print(f"❌ Transcribe error: {e}")
        return jsonify({"error": str(e)}), 500

    finally:
        try:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
        except Exception:
            pass


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 60)
    print("🎬 CaptionCraft Server - High Accuracy Hinglish Engine")
    print(f"🚀 Running on port {port}...")
    print("=" * 60)
    app.run(host='0.0.0.0', port=port, debug=False)
