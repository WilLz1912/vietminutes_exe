"""Speech-to-Text + tách người nói. Mọi provider trả về cùng dạng:
[{"speaker": "1", "start": giây, "end": giây, "text": "..."}]
Các provider thật chưa được chạy thử với key thật – cần kiểm tra lại khi có key.
"""
import json
import os
import time
from pathlib import Path

import httpx

FIXTURES = Path(__file__).resolve().parents[2] / "fixtures" / "mock_meetings.json"
MAX_SEGMENT_SEC = 30.0


def mock(scenario: str) -> list[dict]:
    data = json.loads(FIXTURES.read_text(encoding="utf-8"))
    sc = data.get(scenario) or data["sprint"]
    return [
        {"speaker": g["speakerId"].lstrip("s"), "start": g["start"], "end": g["end"], "text": g["text"]}
        for g in sc["segments"]
    ]


def _group_tokens(tokens: list[dict]) -> list[dict]:
    """Gộp token (từ/âm tiết) liên tiếp cùng người nói thành đoạn; cắt đoạn quá dài ở dấu câu."""
    segs: list[dict] = []
    cur = None
    for t in tokens:
        spk = str(t.get("speaker") or "1")
        text = t.get("text", "")
        start, end = t["start"], t["end"]
        too_long = cur and (end - cur["start"] > MAX_SEGMENT_SEC) and cur["text"].rstrip()[-1:] in ".?!"
        if cur is None or spk != cur["speaker"] or too_long:
            if cur:
                segs.append(cur)
            cur = {"speaker": spk, "start": start, "end": end, "text": text.lstrip()}
        else:
            cur["text"] += text
            cur["end"] = end
    if cur:
        segs.append(cur)
    for s in segs:
        s["text"] = " ".join(s["text"].split())
    return [s for s in segs if s["text"]]


def soniox(audio: Path) -> list[dict]:
    key = os.environ["SONIOX_API_KEY"]
    model = os.environ.get("SONIOX_MODEL", "stt-async-v5")
    base = "https://api.soniox.com/v1"
    with httpx.Client(headers={"Authorization": f"Bearer {key}"}, timeout=120) as c:
        f = c.post(f"{base}/files", files={"file": (audio.name, audio.read_bytes())})
        f.raise_for_status()
        file_id = f.json()["id"]
        tr_id = None
        try:
            r = c.post(
                f"{base}/transcriptions",
                json={
                    "model": model,
                    "file_id": file_id,
                    "language_hints": ["vi", "en"],
                    "enable_speaker_diarization": True,
                },
            )
            r.raise_for_status()
            tr_id = r.json()["id"]
            while True:
                s = c.get(f"{base}/transcriptions/{tr_id}").json()
                if s["status"] == "completed":
                    break
                if s["status"] == "error":
                    raise RuntimeError(f"Soniox: {s.get('error_message')}")
                time.sleep(1.5)
            tokens = c.get(f"{base}/transcriptions/{tr_id}/transcript").json()["tokens"]
        finally:
            # xóa bản sao trên server nhà cung cấp ngay sau khi lấy kết quả
            if tr_id:
                c.delete(f"{base}/transcriptions/{tr_id}")
            c.delete(f"{base}/files/{file_id}")
    return _group_tokens(
        [
            {"speaker": t.get("speaker"), "start": t["start_ms"] / 1000, "end": t["end_ms"] / 1000, "text": t["text"]}
            for t in tokens
            if "start_ms" in t
        ]
    )


def deepgram(audio: Path) -> list[dict]:
    key = os.environ["DEEPGRAM_API_KEY"]
    params = {
        "model": os.environ.get("DEEPGRAM_MODEL", "nova-3"),
        "language": "vi",
        "diarize": "true",
        "punctuate": "true",
        "smart_format": "true",
        "utterances": "true",
        "mip_opt_out": "true",  # không cho dữ liệu vào chương trình cải thiện model của Deepgram
    }
    r = httpx.post(
        "https://api.deepgram.com/v1/listen",
        params=params,
        headers={"Authorization": f"Token {key}", "Content-Type": "application/octet-stream"},
        content=audio.read_bytes(),
        timeout=600,
    )
    r.raise_for_status()
    utts = r.json()["results"].get("utterances", [])
    return [
        {"speaker": str(u.get("speaker", 0) + 1), "start": u["start"], "end": u["end"], "text": u["transcript"].strip()}
        for u in utts
        if u.get("transcript", "").strip()
    ]
