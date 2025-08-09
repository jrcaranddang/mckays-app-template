from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from .workers.tasks import enqueue_generate_video


class BrandKit(BaseModel):
    primary: str = "#FFFFFF"
    secondary: str = "#00E5FF"
    font: str = "Inter"
    watermark_uri: Optional[str] = None


class VideoRecipe(BaseModel):
    topic: str
    niche: str = "general"
    tone: str = "neutral"
    language: str = "en"
    duration_s: int = Field(ge=10, le=90, default=55)
    style_preset: str = "slides_v1"
    brand: BrandKit = Field(default_factory=BrandKit)
    music_family: Optional[str] = None
    cta: Optional[str] = None
    platforms: List[str] = Field(default_factory=lambda: ["tiktok"]) 


class EnqueueResponse(BaseModel):
    request_id: str
    status: str


app = FastAPI(title="Faceless Shorts Generator")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
async def healthz():
    return {"ok": True}


@app.post("/generate", response_model=EnqueueResponse)
async def generate(recipe: VideoRecipe):
    request_id = str(uuid.uuid4())
    try:
        enqueue_generate_video(request_id=request_id, recipe=recipe.model_dump())
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return EnqueueResponse(request_id=request_id, status="queued")