# Streamlit Cloud App Entry Point
import streamlit as st
import tempfile
import os
import json
from server import process_word, get_model, devanagari_to_hinglish

st.set_page_config(
    page_title="Captive AI - Hinglish Speech-to-Text",
    page_icon="🎬",
    layout="wide"
)

st.title("🎬 Captive AI - Speech-to-Hinglish Transcriber")
st.markdown("Raw Video/Audio se **Accurate Word-Level Hinglish Captions** generate karein.")

col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("1. Video / Audio File")
    uploaded_file = st.file_uploader("Video/Audio upload karein (MP4, WAV, MP3, MOV)", type=["mp4", "wav", "mp3", "mov"])
    target_mode = st.radio("Caption Language Style", ["hinglish", "english"], index=0)
    process_btn = st.button("🚀 Transcribe Speech", type="primary", use_container_width=True)

if uploaded_file is not None and process_btn:
    with st.spinner("⏳ Whisper AI audio sun raha hai aur timestamps generate kar raha hai..."):
        # Save temp file
        suffix = os.path.splitext(uploaded_file.name)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(uploaded_file.read())
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
                word_timestamps=True,
                vad_filter=True,
                initial_prompt="Ye ek creator ka Hindi aur Hinglish video reel audio hai."
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
                                "emoji": ""
                            })
                            full_text.append(cleaned)

            with col2:
                st.success(f"✅ Success! {len(words)} Words Transcribed")
                st.subheader("Generated Hinglish Script:")
                st.text_area("Full Script", " ".join(full_text), height=140)

                st.subheader("Word-Level JSON for Captive App:")
                json_str = json.dumps({"words": words}, indent=2)
                st.download_button(
                    label="📥 Download JSON for Captive App",
                    data=json_str,
                    file_name="captions.json",
                    mime="application/json",
                    use_container_width=True
                )
                with st.expander("Show Raw Timestamps JSON"):
                    st.json(words)

        except Exception as e:
            st.error(f"Error: {e}")
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
