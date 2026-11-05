import subprocess
from pathlib import Path
import tempfile
import imageio_ffmpeg

FFMPEG_BIN = imageio_ffmpeg.get_ffmpeg_exe()

def extract_audio(video_path: str, output_path: str = None) -> str:
    """
    Extracts 16kHz mono 16-bit PCM WAV audio from any video format using local FFmpeg.
    Optimized for Whisper input.
    """
    v_path = Path(video_path)
    if not v_path.exists():
        raise FileNotFoundError(f"Video file not found at: {video_path}")

    if not output_path:
        tmp = tempfile.NamedTemporaryFile(suffix="_extracted.wav", delete=False)
        output_path = tmp.name
        tmp.close()

    cmd = [
        FFMPEG_BIN,
        "-y",
        "-i", str(v_path),
        "-vn",                      # Disable video recording
        "-acodec", "pcm_s16le",     # 16-bit PCM
        "-ar", "16000",             # 16kHz sampling rate
        "-ac", "1",                 # Mono channel
        str(output_path)
    ]

    process = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    if process.returncode != 0:
        raise RuntimeError(f"FFmpeg extraction failed: {process.stderr}")

    return output_path
