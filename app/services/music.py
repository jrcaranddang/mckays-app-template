import os
import glob
import subprocess
from typing import Optional

MUSIC_DIR = os.getenv("MUSIC_DIR", "/workspace/music")


def _run(cmd):
    subprocess.run(cmd, check=True)


def select_or_generate_music(output_wav_path: str, family: Optional[str], duration_s: float) -> Optional[str]:
    os.makedirs(os.path.dirname(output_wav_path), exist_ok=True)

    # Try to find a matching file in MUSIC_DIR
    candidates = []
    if os.path.isdir(MUSIC_DIR):
        patterns = ["*.mp3", "*.wav", "*.m4a", "*.flac", "*.aac", "*.ogg"]
        files = []
        for p in patterns:
            files.extend(glob.glob(os.path.join(MUSIC_DIR, p)))
        if family:
            files = [f for f in files if family.lower() in os.path.basename(f).lower()]
        candidates = files

    if candidates:
        # Use the first candidate, convert and trim to duration
        src = candidates[0]
        _run(["ffmpeg", "-y", "-i", src, "-t", f"{duration_s:.3f}", "-ar", "44100", "-ac", "2", output_wav_path])
        return output_wav_path

    # Fallback: generate gentle pink noise bed
    try:
        _run([
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", f"anoisesrc=color=pink:amplitude=0.02:s=44100",
            "-t", f"{duration_s:.3f}",
            "-ar", "44100", "-ac", "2",
            output_wav_path,
        ])
        return output_wav_path
    except Exception:
        return None