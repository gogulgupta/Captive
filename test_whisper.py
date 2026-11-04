import traceback
try:
    from faster_whisper import WhisperModel
    m = WhisperModel("tiny", device="cpu", compute_type="int8")
    print("MODEL LOADED OK")
except Exception:
    traceback.print_exc()

