from typing import List


def generate_script_beats(topic: str, duration_s: int, tone: str) -> List[str]:
    max_beats = max(min(duration_s // 6, 9), 4)
    template = [
        f"Hook: {topic} in under a minute.",
        f"First, here's what most people miss about {topic}.",
        f"Now, a quick tip you can use today.",
        f"Let's break it down in seconds.",
        f"Watch this if you want the shortcut.",
        f"One more thing nobody tells you.",
        f"Recap: main takeaways in one line.",
        f"Action: try it and save this for later.",
        f"CTA: follow for more like this."
    ]
    return template[:max_beats]