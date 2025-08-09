import os
import subprocess
import tempfile
from typing import List, Tuple
import requests

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")


def _ffprobe_duration(path: str) -> float:
    try:
        out = subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", path
        ], stderr=subprocess.DEVNULL)
        return float(out.decode().strip())
    except Exception:
        return 0.0


def _generate_silence_wav(path: str, duration_s: float) -> None:
    subprocess.run([
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
        "-t", f"{duration_s:.3f}",
        "-c:a", "pcm_s16le",
        path,
    ], check=True)


def synthesize_tts_for_beats(beats: List[str]) -> Tuple[str, float]:
    os.makedirs("/workspace/output/tts", exist_ok=True)
    text = " ".join(beats)
    target_path = "/workspace/output/tts/voiceover.wav"

    if ELEVENLABS_API_KEY and text.strip():
        try:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": ELEVENLABS_API_KEY,
            }
            payload = {
                "text": text,
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.5, "style": 0.3, "use_speaker_boost": True},
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=60)
            resp.raise_for_status()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp_mp3:
                tmp_mp3.write(resp.content)
                tmp_mp3.flush()
                mp3_path = tmp_mp3.name
            # Convert to wav
            subprocess.run(["ffmpeg", "-y", "-i", mp3_path, "-ar", "44100", "-ac", "2", target_path], check=True)
            dur = _ffprobe_duration(target_path)
            if dur > 0:
                return target_path, dur
        except Exception:
            pass

    # Fallback: estimate duration ~165 wpm
    words = max(len(text) / 5.0, 1.0)
    minutes = words / 165.0
    est = max(minutes * 60.0, 6.0)
    _generate_silence_wav(target_path, est)
    return target_path, est