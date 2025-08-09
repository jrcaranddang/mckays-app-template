import os
import io
import math
from typing import List, Tuple
import requests
from pydub import AudioSegment

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # default voice


def _estimate_audio_duration_seconds(total_chars: int, wpm: int = 165) -> float:
    words = max(total_chars / 5.0, 1.0)
    minutes = words / float(wpm)
    return max(minutes * 60.0, 4.0)


def synthesize_tts_for_beats(beats: List[str]) -> Tuple[str, float]:
    """
    Synthesize a single TTS audio for all beats concatenated with spaces.
    Returns: (audio_path, duration_seconds)
    Fallback: If ELEVENLABS_API_KEY is missing or request fails, create a silent wav matching estimated duration.
    """
    os.makedirs("/workspace/output/tts", exist_ok=True)
    text = " ".join(beats)
    target_path = "/workspace/output/tts/voiceover.wav"

    if ELEVENLABS_API_KEY:
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
            audio_mp3 = AudioSegment.from_file(io.BytesIO(resp.content), format="mp3")
            audio_mp3.export(target_path, format="wav")
            return target_path, audio_mp3.duration_seconds
        except Exception:
            pass

    # Fallback: generate silence based on text length
    est = _estimate_audio_duration_seconds(len(text))
    silence = AudioSegment.silent(duration=int(est * 1000))
    silence.export(target_path, format="wav")
    return target_path, est