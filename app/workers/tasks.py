from typing import Dict, Any
from .celery_app import celery_app
from app.services.pipeline import generate_video_pipeline


@celery_app.task(name="generate_video_task")
def generate_video_task(request_id: str, recipe: Dict[str, Any]) -> Dict[str, Any]:
    output_path = generate_video_pipeline(request_id=request_id, recipe=recipe)
    return {"request_id": request_id, "output_path": output_path}


def enqueue_generate_video(request_id: str, recipe: Dict[str, Any]) -> None:
    generate_video_task.delay(request_id=request_id, recipe=recipe)