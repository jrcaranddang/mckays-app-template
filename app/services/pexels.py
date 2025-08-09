import os
import random
import requests
from typing import Optional

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
SESSION = requests.Session()
if PEXELS_API_KEY:
    SESSION.headers.update({"Authorization": PEXELS_API_KEY})


def search_and_download_pexels_video(query: str, out_dir: str, orientation: str = "portrait") -> Optional[str]:
    os.makedirs(out_dir, exist_ok=True)
    if not PEXELS_API_KEY:
        return None
    try:
        params = {"query": query, "per_page": 5}
        if orientation in ("landscape", "portrait", "square"):
            params["orientation"] = orientation
        resp = SESSION.get("https://api.pexels.com/videos/search", params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        videos = data.get("videos", [])
        if not videos:
            return None
        choice = random.choice(videos)
        files = choice.get("video_files", [])
        # Prefer 1080x1920 portrait or closest
        files_sorted = sorted(files, key=lambda f: (abs((f.get("width") or 1080) - 1080) + abs((f.get("height") or 1920) - 1920))) )
        url = files_sorted[0]["link"] if files_sorted else None
        if not url:
            return None
        # Download
        r = SESSION.get(url, stream=True, timeout=60)
        r.raise_for_status()
        file_path = os.path.join(out_dir, f"{choice.get('id')}.mp4")
        with open(file_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return file_path
    except Exception:
        return None