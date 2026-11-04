import os
import gradio as gr
from server import process_word, get_model, devanagari_to_hinglish
import tempfile

def transcribe_audio(audio_path, target_mode="hinglish"):
    if not audio_path:
        return "No audio uploaded", []

    model = get_model()
    task = "translate" if target_mode == "english" else "transcribe"
    whisper_lang = "hi" if target_mode == "hinglish" else None

    segments, info = model.transcribe(
        audio_path,
        language=whisper_lang,
        task=task,
        word_timestamps=True,
        vad_filter=True,
    )

    words = []
    full_text = []

    for seg in segments:
        if seg.words:
            for w in seg.words:
                cleaned = process_word(w.word, target_mode)
                if cleaned:
                    words.append({
                        "id": len(words) + 1,
                        "text": cleaned,
                        "start": round(w.start, 2),
                        "end": round(w.end, 2),
                    })
                    full_text.append(cleaned)

    return " ".join(full_text), words

demo = gr.Interface(
    fn=transcribe_audio,
    inputs=[
        gr.Audio(type="filepath", label="Upload Audio / Video"),
        gr.Radio(["hinglish", "english"], label="Output Mode", value="hinglish")
    ],
    outputs=[
        gr.Textbox(label="Full Hinglish Script"),
        gr.JSON(label="Word Timestamps for Captive Web App")
    ],
    title="🎬 Captive AI - Speech-to-Hinglish Cloud API",
    description="Free cloud inference endpoint for Captive Video Caption Generator"
)

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
