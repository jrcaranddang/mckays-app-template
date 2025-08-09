from typing import List, Dict

def _format_timestamp(seconds: float, srt: bool = True) -> str:
    ms = int(round((seconds - int(seconds)) * 1000))
    total = int(seconds)
    h = total // 3600
    m = (total % 3600) // 60
    s = total % 60
    if srt:
        return f"{h:02}:{m:02}:{s:02},{ms:03}"
    else:
        return f"{h:02}:{m:02}:{s:02}.{ms:03}"


def write_srt(captions: List[Dict], path: str) -> None:
    lines: List[str] = []
    for idx, cap in enumerate(captions, start=1):
        start = _format_timestamp(float(cap["start"]))
        end = _format_timestamp(float(cap["end"]))
        text = str(cap["text"]).strip()
        lines.append(str(idx))
        lines.append(f"{start} --> {end}")
        lines.append(text)
        lines.append("")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def write_vtt(captions: List[Dict], path: str) -> None:
    lines: List[str] = ["WEBVTT", ""]
    for cap in captions:
        start = _format_timestamp(float(cap["start"]), srt=False)
        end = _format_timestamp(float(cap["end"]), srt=False)
        text = str(cap["text"]).strip()
        lines.append(f"{start} --> {end}")
        lines.append(text)
        lines.append("")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))