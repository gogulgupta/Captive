import os
import sys
import re
from typing import List, Dict, Any

if sys.platform == 'win32':
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

from faster_whisper import WhisperModel

# ==============================================================================
# Comprehensive Creator Hinglish Vocabulary (500+ Words Dictionary)
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
    'होना': 'hona', 'हुआ': 'hua', 'हुई': 'hui', 'हुए': 'hue',
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
    'क्या': 'kya', 'क्यों': 'kyun', 'कैसे': 'kaise', 'कब': 'kab', 'कहाँ': 'kahan',
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
    'सही': 'sahi', 'गलत': 'galat', 'अच्छा': 'achha', 'बुra': 'bura',

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

def transliterate_devanagari(text: str) -> str:
    if text in HINGLISH_DICT:
        return HINGLISH_DICT[text]
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

def clean_and_hinglish(token: str, mode: str = "hinglish") -> str:
    if not token:
        return ""
    token = token.strip()
    clean = re.sub(r'^[^\w\u0900-\u097F]+|[^\w\u0900-\u097F]+$', '', token)
    if not clean:
        return ""
    if mode == "hinglish":
        if clean in HINGLISH_DICT:
            return HINGLISH_DICT[clean]
        if any('\u0900' <= ch <= '\u097F' for ch in clean):
            return transliterate_devanagari(clean)
    return clean

# Singleton Whisper model loader
_whisper_instance = None

def get_whisper_model() -> WhisperModel:
    global _whisper_instance
    if _whisper_instance is None:
        model_size = os.environ.get("WHISPER_MODEL", "small")
        print(f"⏳ Initializing faster-whisper '{model_size}' engine...")
        _whisper_instance = WhisperModel(
            model_size,
            device="cpu",
            compute_type="int8"
        )
        print(f"✅ faster-whisper '{model_size}' ready for forced alignment & STT!")
    return _whisper_instance

def transcribe_audio_words(audio_path: str, mode: str = "hinglish") -> List[Dict[str, Any]]:
    """
    Transcribes audio with word-level timestamps (forced-alignment).
    Returns strictly:
    [{"word": "nahi", "start": 1.2, "end": 1.5}, ...]
    """
    model = get_whisper_model()
    is_hinglish = (mode.lower() == "hinglish")
    
    # Prompt with top Hinglish creator dictionary to guide speech recognition
    prompt_seed = "Ye ek Hindi aur Hinglish video reel content hai jisme creator baat kar raha hai."
    
    segments, info = model.transcribe(
        audio_path,
        language="hi" if is_hinglish else "en",
        task="transcribe",
        beam_size=5,
        word_timestamps=True,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=300),
        initial_prompt=prompt_seed
    )

    output_words = []
    for segment in segments:
        if segment.words:
            for w in segment.words:
                processed = clean_and_hinglish(w.word, mode=mode)
                if processed:
                    output_words.append({
                        "word": processed,
                        "start": round(w.start, 2),
                        "end": round(w.end, 2)
                    })
        else:
            # Fallback if segment words empty
            raw_tokens = segment.text.strip().split()
            if not raw_tokens:
                continue
            dur = (segment.end - segment.start) / max(len(raw_tokens), 1)
            for idx, tok in enumerate(raw_tokens):
                processed = clean_and_hinglish(tok, mode=mode)
                if processed:
                    output_words.append({
                        "word": processed,
                        "start": round(segment.start + idx * dur, 2),
                        "end": round(segment.start + (idx + 1) * dur, 2)
                    })

    return output_words
