import os
import json
from typing import Dict, Any, List
from .script import generate_script_beats
from .render import render_slides_video, render_kinetic_video
from .tts import synthesize_tts_for_beats
from .pexels import search_and_download_pexels_video

OUTPUT_DIR = os.getenv("OUTPUT_DIR", "/workspace/output")


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _timings_from_duration(beats: List[str], total_duration: float) -> List[Dict[str, Any]]:
    per_beat = max(total_duration / max(len(beats), 1), 1.5)
    captions: List[Dict[str, Any]] = []
    t = 0.0
    for beat in beats:
        start = t
        end = min(t + per_beat, total_duration)
        captions.append({"text": beat, "start": round(start, 2), "end": round(end, 2)})
        t = end
    return captions


def generate_video_pipeline(request_id: str, recipe: Dict[str, Any]) -> str:
    ensure_dir(OUTPUT_DIR)
    job_dir = os.path.join(OUTPUT_DIR, request_id)
    ensure_dir(job_dir)

    # 1) Script beats
    beats = generate_script_beats(topic=recipe.get("topic", ""), duration_s=int(recipe.get("duration_s", 55)), tone=recipe.get("tone", "neutral"))

    # 2) TTS voiceover for total duration
    vo_path, vo_duration = synthesize_tts_for_beats(beats)

    # 3) Phrase-level captions by distributing TTS duration
    captions = _timings_from_duration(beats, vo_duration)

    style = recipe.get("style_preset", "slides_v1")

    # 4) Attempt Pexels for slides style
    assets: List[str] = []
    if style.startswith("slides"):
        assets_dir = os.path.join(job_dir, "assets")
        ensure_dir(assets_dir)
        for beat in beats:
            clip = search_and_download_pexels_video(beat, assets_dir, orientation="portrait")
            assets.append(clip or "")

    # 5) Render
    brand = recipe.get("brand", {})
    output_mp4 = os.path.join(job_dir, "video.mp4")
    if style.startswith("kinetic"):
        render_kinetic_video(beats=beats, captions=captions, output_path=output_mp4, brand=brand)
    else:
        render_slides_video(beats=beats, captions=captions, output_path=output_mp4, brand=brand, assets=assets)

    # 6) Mux voiceover if exists
    try:
        from subprocess import run
        muxed = os.path.join(job_dir, "video_with_vo.mp4")
        run([
            "ffmpeg", "-y",
            "-i", output_mp4,
            "-i", vo_path,
            "-c:v", "copy",
            "-c:a", "aac", "-shortest",
            muxed
        ], check=True)
        output_mp4 = muxed
    except Exception:
        pass

    # 7) Watermark overlay if provided
    wm = (recipe.get("brand", {}) or {}).get("watermark_uri")
    if wm and os.path.exists(wm):
        watermarked = os.path.join(job_dir, "video_final.mp4")
        try:
            from subprocess import run
            run([
                "ffmpeg", "-y",
                "-i", output_mp4,
                "-i", wm,
                "-filter_complex", "[0:v][1:v]overlay=W-w-40:H-h-40:format=auto[v]",
                "-map", "[v]", "-map", "0:a?",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                watermarked
            ], check=True)
            output_mp4 = watermarked
        except Exception:
            pass

    with open(os.path.join(job_dir, "metadata.json"), "w") as f:
        json.dump({"recipe": recipe, "beats": beats, "captions": captions, "voiceover": vo_path, "assets": assets}, f, indent=2)

    return output_mp4