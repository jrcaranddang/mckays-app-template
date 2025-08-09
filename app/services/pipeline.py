import os
import json
from typing import Dict, Any, List
from datetime import datetime
from .script import generate_script_beats
from .render import render_slides_video

OUTPUT_DIR = os.getenv("OUTPUT_DIR", "/workspace/output")


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def generate_video_pipeline(request_id: str, recipe: Dict[str, Any]) -> str:
    ensure_dir(OUTPUT_DIR)
    job_dir = os.path.join(OUTPUT_DIR, request_id)
    ensure_dir(job_dir)

    # 1) Script beats
    beats = generate_script_beats(topic=recipe.get("topic", ""), duration_s=int(recipe.get("duration_s", 55)), tone=recipe.get("tone", "neutral"))

    # 2) Simple captions (word-level timings evenly spread)
    captions: List[Dict[str, Any]] = []
    start_time = 0.0
    total_duration = int(recipe.get("duration_s", 55))
    per_beat = max(total_duration / max(len(beats), 1), 2.0)
    for beat in beats:
        words = beat.split()
        if not words:
            continue
        per_word = per_beat / len(words)
        t = start_time
        for w in words:
            captions.append({"text": w, "start": round(t, 2), "end": round(t + per_word, 2)})
            t += per_word
        start_time += per_beat

    # 3) Render slides video
    brand = recipe.get("brand", {})
    output_mp4 = os.path.join(job_dir, "video.mp4")
    render_slides_video(beats=beats, captions=captions, output_path=output_mp4, brand=brand)

    # 4) Save metadata
    with open(os.path.join(job_dir, "metadata.json"), "w") as f:
        json.dump({"recipe": recipe, "beats": beats}, f, indent=2)

    return output_mp4