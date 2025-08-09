import os
import math
import subprocess
from typing import List, Dict, Any, Optional

FONT_FALLBACK = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def _escape_value(value: str) -> str:
    return (
        value.replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace(",", "\\,")
        .replace("'", "\\'")
    )


def _build_drawtext(text: str, x: str, y: str, fontsize: int, fontcolor: str, boxcolor: str = None, fontfile: str = None) -> str:
    text_escaped = _escape_value(text)
    options = [
        "drawtext",
        f"text='{text_escaped}'",
        f"x={x}",
        f"y={y}",
        f"fontsize={fontsize}",
        f"fontcolor={fontcolor}",
        f"fontfile='{fontfile or FONT_FALLBACK}'",
    ]
    if boxcolor:
        options.append("box=1")
        options.append(f"boxcolor={boxcolor}")
        options.append("boxborderw=20")
    return "=".join([options[0], ":".join(options[1:])])


def _run(cmd: List[str]) -> None:
    subprocess.run(cmd, check=True)


def _segment_duration(captions: List[Dict[str, Any]], index: int, default: float) -> float:
    if 0 <= index < len(captions):
        start = float(captions[index].get("start", 0.0))
        end = float(captions[index].get("end", start + default))
        return max(end - start, 0.5)
    return default


def render_slides_video(
    beats: List[str],
    captions: List[Dict[str, Any]],
    output_path: str,
    brand: Dict[str, Any],
    assets: Optional[List[str]] = None,
) -> None:
    primary = brand.get('primary', '#FFFFFF')
    secondary = brand.get('secondary', '#00E5FF')

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    seg_dir = os.path.join(os.path.dirname(output_path), "segments")
    os.makedirs(seg_dir, exist_ok=True)

    num_beats = max(len(beats), 1)
    default_total = max(10.0, float(num_beats) * 3.0)
    per_default = default_total / float(num_beats)

    segment_files: List[str] = []
    for i, beat in enumerate(beats or ["..."]):
        duration = _segment_duration(captions, i, per_default)
        segment_path = os.path.join(seg_dir, f"seg_{i:02d}.mp4")
        title = beat
        body = beat
        text_filters = ",".join([
            _build_drawtext(title, x='(w-text_w)/2', y='h*0.12', fontsize=64, fontcolor=primary, boxcolor=f"{secondary}@0.20"),
            _build_drawtext(body, x='(w-text_w)/2', y='h*0.80', fontsize=56, fontcolor=primary, boxcolor='#000000@0.4'),
        ])

        asset_path = (assets[i] if assets and i < len(assets) and assets[i] and os.path.exists(assets[i]) else None)
        if asset_path:
            # Use asset video, scale/crop to 1080x1920, then overlay text
            vf = ",".join([
                "scale=1080:1920:force_original_aspect_ratio=increase",
                "crop=1080:1920",
                text_filters,
            ])
            cmd = [
                "ffmpeg", "-y",
                "-i", asset_path,
                "-t", f"{duration:.3f}",
                "-vf", vf,
                "-an",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
                segment_path,
            ]
        else:
            # Fallback to solid color background
            vf = text_filters
            cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi", "-i", f"color=c={secondary}:size=1080x1920:rate=30",
                "-t", f"{duration:.3f}",
                "-vf", vf,
                "-an",
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
                segment_path,
            ]
        _run(cmd)
        segment_files.append(segment_path)

    # Concat segments
    concat_list = os.path.join(seg_dir, "concat.txt")
    with open(concat_list, "w") as f:
        for p in segment_files:
            f.write(f"file '{p}'\n")

    cmd_concat = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", concat_list,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-an",
        output_path,
    ]
    _run(cmd_concat)


def render_kinetic_video(
    beats: List[str],
    captions: List[Dict[str, Any]],
    output_path: str,
    brand: Dict[str, Any],
) -> None:
    primary = brand.get('primary', '#FFFFFF')
    secondary = brand.get('secondary', '#111111')

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    seg_dir = os.path.join(os.path.dirname(output_path), "segments")
    os.makedirs(seg_dir, exist_ok=True)

    num_beats = max(len(beats), 1)
    default_total = max(10.0, float(num_beats) * 3.0)
    per_default = default_total / float(num_beats)

    segment_files: List[str] = []
    for i, beat in enumerate(beats or ["..."]):
        duration = _segment_duration(captions, i, per_default)
        segment_path = os.path.join(seg_dir, f"kin_{i:02d}.mp4")
        # Slide-in from bottom to top area over first 0.5s then hold
        y_expr = "if(lt(t,0.5),h*0.85-(h*0.55)*(t/0.5),h*0.30)"
        text_filter = _build_drawtext(
            beat,
            x='(w-text_w)/2',
            y=f"'{y_expr}'",
            fontsize=72,
            fontcolor=primary,
            boxcolor=f"{secondary}@0.6",
        )
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", f"color=c={secondary}:size=1080x1920:rate=30",
            "-t", f"{duration:.3f}",
            "-vf", text_filter,
            "-an",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
            segment_path,
        ]
        _run(cmd)
        segment_files.append(segment_path)

    # Concat segments
    concat_list = os.path.join(seg_dir, "concat.txt")
    with open(concat_list, "w") as f:
        for p in segment_files:
            f.write(f"file '{p}'\n")

    cmd_concat = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", concat_list,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-an",
        output_path,
    ]
    _run(cmd_concat)