"""Điều phối job (control plane). Chỉ giữ trạng thái tối thiểu trong RAM, không ghi nội dung cuộc họp ra log/đĩa lâu dài."""
import logging
import shutil
import tempfile
import threading
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path

from . import config, sandbox
from .verify import verify

log = logging.getLogger("vietminutes")

STAGES = {
    "queued": "Đang chờ",
    "stt": "Môi trường 1: chép lời & tách người nói",
    "minutes": "Môi trường 2: tạo biên bản",
    "verify": "Kiểm tra dẫn chiếu câu gốc",
    "done": "Hoàn tất",
    "failed": "Lỗi",
}


@dataclass
class Job:
    id: str
    status: str = "queued"
    created: float = field(default_factory=time.time)
    finished: float | None = None
    audit: list[dict] = field(default_factory=list)
    result: dict | None = None
    error: str | None = None

    def note(self, text: str) -> None:
        self.audit.append({"at": int(time.time() * 1000), "text": text})
        log.info("job %s: %s", self.id, text)  # audit không chứa nội dung cuộc họp

    def public(self) -> dict:
        return {
            "id": self.id,
            "status": self.status,
            "stage": STAGES[self.status],
            "audit": self.audit,
            "result": self.result,
            "error": self.error,
        }


_jobs: dict[str, Job] = {}
_lock = threading.Lock()


def get(job_id: str) -> Job | None:
    with _lock:
        return _jobs.get(job_id)


def purge(job_id: str) -> bool:
    with _lock:
        return _jobs.pop(job_id, None) is not None


def purge_expired() -> None:
    now = time.time()
    with _lock:
        for jid in [j.id for j in _jobs.values() if j.finished and now - j.finished > config.RESULT_TTL]:
            _jobs.pop(jid, None)
            log.info("job %s: hết hạn, đã xóa kết quả khỏi bộ nhớ", jid)


def create(audio_bytes: bytes, filename: str, request: dict) -> Job:
    job = Job(id=uuid.uuid4().hex[:12])
    with _lock:
        _jobs[job.id] = job
    # kho tạm cho audio: chỉ tồn tại đến khi Môi trường 1 chép lời xong
    vault = Path(tempfile.mkdtemp(prefix="vm-vault-"))
    ext = Path(filename).suffix.lower() or ".bin"
    audio = vault / f"audio{ext}"
    audio.write_bytes(audio_bytes)
    job.note(f"Nhận file ghi âm {len(audio_bytes) / 1024 / 1024:.1f} MB, lưu vào kho tạm")
    threading.Thread(target=_pipeline, args=(job, vault, audio, request), daemon=True).start()
    return job


def _pipeline(job: Job, vault: Path, audio: Path, req: dict) -> None:
    try:
        # MÔI TRƯỜNG 1: chỉ audio vào, chỉ chữ ra
        job.status = "stt"
        out1 = sandbox.run(
            "stt",
            {"provider": config.STT_PROVIDER, "audio_name": audio.name, "mock_scenario": req.get("mock_scenario")},
            files={audio.name: audio},
            secrets=config.STT_SECRETS.get(config.STT_PROVIDER, {}),
            timeout=config.SANDBOX_TIMEOUT_STT,
            audit=job.note,
        )
        shutil.rmtree(vault, ignore_errors=True)
        job.note("Đã xóa file ghi âm khỏi máy chủ VietMinutes (bản nghe lại chỉ nằm trên trình duyệt của bạn)")
        if config.STT_PROVIDER == "soniox":
            job.note("Đã yêu cầu nhà cung cấp chép lời xóa file và kết quả trên server của họ")

        raw = out1["segments"]
        labels: dict[str, str] = {}
        for g in raw:
            labels.setdefault(g["speaker"], f"s{len(labels) + 1}")
        segments = [
            {
                "id": f"g{i + 1}",
                "speakerId": labels[g["speaker"]],
                "speaker": f"Speaker {labels[g['speaker']][1:]}",
                "start": round(g["start"], 2),
                "end": round(g["end"], 2),
                "text": g["text"],
            }
            for i, g in enumerate(raw)
        ]
        job.note(f"Môi trường 1 trả về {len(segments)} đoạn transcript, {len(labels)} người nói")

        # MÔI TRƯỜNG 2: chỉ transcript vào (không audio), chỉ JSON biên bản ra
        job.status = "minutes"
        out2 = sandbox.run(
            "minutes",
            {
                "provider": config.LLM_PROVIDER,
                "segments": [{k: g[k] for k in ("id", "speaker", "start", "end", "text")} for g in segments],
                "template": req["template"],
                "glossary": req.get("glossary", []),
                "meeting_date": req.get("meeting_date"),
                "mock_scenario": req.get("mock_scenario"),
            },
            files={},
            secrets=config.LLM_SECRETS.get(config.LLM_PROVIDER, {}),
            timeout=config.SANDBOX_TIMEOUT_LLM,
            audit=job.note,
        )

        job.status = "verify"
        raw_minutes = out2["minutes"]
        minutes, stats = verify(raw_minutes, segments)
        job.note(
            f"Kiểm tra bằng code: {stats['passed']}/{stats['total']} mục khớp câu gốc, "
            f"{stats['flagged']} mục được tô vàng chờ bạn xác nhận"
        )

        # tên người nói AI đoán được: chỉ là gợi ý, người dùng bấm "Áp dụng" mới đổi
        by_label = {
            n["speaker"]: n
            for n in raw_minutes.get("speaker_names", [])
            if n.get("name") and any(g["id"] == n.get("evidence") for g in segments)
        }
        speakers = []
        for sid in labels.values():
            label = f"Speaker {sid[1:]}"
            sp = {"id": sid, "label": label, "name": ""}
            if label in by_label:
                sp["suggested"] = by_label[label]["name"]
                sp["evidence"] = by_label[label]["evidence"]
            speakers.append(sp)

        job.result = {
            "speakers": speakers,
            "segments": [{k: g[k] for k in ("id", "speakerId", "start", "end", "text")} for g in segments],
            "minutes": minutes,
            "info": {
                "purpose": raw_minutes.get("purpose", ""),
                "chair": raw_minutes.get("chair", ""),
                "location": raw_minutes.get("location", ""),
            },
            "duration": segments[-1]["end"] if segments else 0,
            "engine": {"stt": config.STT_PROVIDER, "llm": config.LLM_PROVIDER},
        }
        job.status = "done"
        job.note(f"Hoàn tất. Kết quả chỉ giữ trong bộ nhớ đến khi web nhận (tối đa {config.RESULT_TTL // 60} phút) rồi xóa")
    except Exception as e:  # noqa: BLE001
        job.status = "failed"
        job.error = str(e)[:300]
        job.note(f"Lỗi: {job.error}")
    finally:
        shutil.rmtree(vault, ignore_errors=True)
        job.finished = time.time()
