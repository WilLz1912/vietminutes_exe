"""VietMinutes AI service. Chạy: .venv/Scripts/python -m uvicorn app.main:app --port 8000"""
import asyncio
import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import config, jobs

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

ALLOWED_EXT = {".mp3", ".wav", ".m4a", ".webm"}
MAX_BYTES = 100 * 1024 * 1024


@asynccontextmanager
async def lifespan(_: FastAPI):
    async def janitor():
        while True:
            jobs.purge_expired()
            await asyncio.sleep(30)

    task = asyncio.create_task(janitor())
    yield
    task.cancel()


app = FastAPI(title="VietMinutes AI", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.WEB_ORIGIN],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True, **config.provider_ready(), "sandbox": "process-per-stage"}


@app.post("/jobs")
async def create_job(file: UploadFile = File(...), request: str = Form(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"Định dạng không hỗ trợ: {ext}")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(400, "File quá 100 MB")
    try:
        req = json.loads(request)
        req["template"]["sections"]
    except (ValueError, KeyError, TypeError):
        raise HTTPException(400, "Thiếu thông tin mẫu biên bản")
    ready = config.provider_ready()
    if not (ready["stt_ready"] and ready["llm_ready"]):
        raise HTTPException(503, "Chưa cấu hình API key cho provider đang chọn")
    job = jobs.create(data, file.filename or "audio", req)
    return {"id": job.id}


@app.get("/jobs/{job_id}")
def get_job(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Không tìm thấy job (có thể đã bị xóa)")
    return job.public()


@app.delete("/jobs/{job_id}")
def delete_job(job_id: str):
    """Web gọi sau khi đã nhận kết quả: xóa ngay kết quả khỏi bộ nhớ server."""
    return {"deleted": jobs.purge(job_id)}
