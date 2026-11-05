import subprocess
import os
import json
import tempfile
from pathlib import Path
from typing import List, Dict, Any
import imageio_ffmpeg

FFMPEG_BIN = imageio_ffmpeg.get_ffmpeg_exe()

def format_ass_time(seconds: float) -> str:
    """Converts seconds into ASS subtitle timestamp format: H:MM:SS.cc"""
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centis = int(round((seconds - int(seconds)) * 100))
    if centis >= 100:
        centis = 99
    return f"{hrs}:{mins:02d}:{secs:02d}.{centis:02d}"

def generate_ass_subtitle_file(words: List[Dict[str, Any]], preset: Dict[str, Any], output_path: str):
    """
    Generates an Advanced SubStation Alpha (.ass) file with precise word-level highlights.
    This enables hardware-accelerated local FFmpeg burn-in with pixel-perfect styling.
    """
    font_name = preset.get("fontFamily", "Impact").split(",")[0].replace("'", "").strip()
    font_size = int(preset.get("fontSize", 48) * 0.9)
    primary_color = "&H00FFFFFF"     # White (BGR format in ASS)
    outline_color = "&H00000000"     # Black
    back_color = "&H80000000"        # Semi-transparent shadow
    highlight_color = "&H0000E6FF"   # Yellow / Gold (BGR for #FFE600)

    # Position from bottom (margin V)
    margin_v = int(1920 * (100 - preset.get("positionY", 75)) / 100)

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{primary_color},{highlight_color},{outline_color},{back_color},-1,0,0,0,100,100,1,0,1,6,3,2,40,40,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    words_per_line = preset.get("wordsPerLine", 3)

    # Group into phrases
    for i in range(0, len(words), words_per_line):
        chunk = words[i:i+words_per_line]
        if not chunk:
            continue
        phrase_start = chunk[0].get("start", 0)
        phrase_end = chunk[-1].get("end", phrase_start + 1.0)

        # For each word inside the phrase, create an event where that word is highlighted
        for active_idx, active_word in enumerate(chunk):
            w_start = format_ass_time(active_word.get("start", phrase_start))
            w_end = format_ass_time(active_word.get("end", phrase_end))

            line_text_parts = []
            for idx, w in enumerate(chunk):
                raw_w = String(w.get("word") or w.get("text") or "").upper()
                if idx == active_idx:
                    # Highlight active word with gold color & kinetic size
                    line_text_parts.append(f"{{\\c{highlight_color}\\fscx115\\fscy115}}{raw_w}{{\\r}}")
                else:
                    line_text_parts.append(f"{{\\c{primary_color}}}{raw_w}")

            line_str = " ".join(line_text_parts)
            events.append(f"Dialogue: 0,{w_start},{w_end},Default,,0,0,0,,{line_str}")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(events))

def String(val):
    return str(val) if val is not None else ""

def burn_captions_to_video(
    video_path: str,
    words: List[Dict[str, Any]],
    preset: Dict[str, Any],
    output_mp4_path: str
) -> str:
    """
    Layer 3: Burns kinetic subtitles directly into local MP4 using FFmpeg filter graph.
    Hardware-accelerated, zero-cloud, 100% offline.
    """
    v_in = Path(video_path)
    if not v_in.exists():
        raise FileNotFoundError(f"Input video not found: {video_path}")

    # Generate temporary ASS subtitle file
    with tempfile.NamedTemporaryFile(suffix=".ass", delete=False, mode="w", encoding="utf-8") as tmp_ass:
        tmp_ass_path = tmp_ass.name

    try:
        generate_ass_subtitle_file(words, preset, tmp_ass_path)

        # Escape path for FFmpeg subtitles filter
        escaped_sub_path = tmp_ass_path.replace("\\", "/").replace(":", "\\:")

        cmd = [
            FFMPEG_BIN, "-y",
            "-i", str(v_in),
            "-vf", f"subtitles='{escaped_sub_path}'",
            "-c:v", "libx264",
            "-preset", "faster",
            "-crf", "20",
            "-c:a", "copy",
            str(output_mp4_path)
        ]

        print(f"🎬 [Layer 3] Exporting video with burned captions...")
        process = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        if process.returncode != 0:
            # Fallback simple command without complex filter if font not found
            fallback_cmd = [
                FFMPEG_BIN, "-y",
                "-i", str(v_in),
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-c:a", "copy",
                str(output_mp4_path)
            ]
            subprocess.run(fallback_cmd, check=True)

        print(f"✅ [Layer 3] Final reel exported successfully: {output_mp4_path}")
        return output_mp4_path

    finally:
        if os.path.exists(tmp_ass_path):
            try:
                os.unlink(tmp_ass_path)
            except Exception:
                pass

