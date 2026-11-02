"""Tầng kiểm tra bằng code (chạy ngoài hộp, không dùng AI).

Mọi mục do LLM tạo phải có căn cứ trong transcript; mục nào không qua kiểm tra
bị hạ xuống confidence "low" kèm lý do, để người dùng xác nhận trước khi duyệt biên bản.
"""
import re
import unicodedata
import uuid
from difflib import SequenceMatcher

UNKNOWN = "Chưa xác định"
# từ không mang thông tin khi so deadline
_STOP = {"trong", "truoc", "sau", "vao", "ngay", "luc", "khoang", "tam", "chac", "la", "nay", "nhe", "thi", "cua", "va", "hoac"}


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower().replace("đ", "d"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"\b0(\d)", r"\1", s)  # 05/11 == 5/11
    return re.sub(r"[^a-z0-9/ ]+", " ", s).strip()


def _words(s: str) -> list[str]:
    return [w for w in norm(s).split() if w not in _STOP]


def _quote_found(quote: str, text: str) -> bool:
    q, t = norm(quote), norm(text)
    if not q:
        return True
    if q in t:
        return True
    # cho phép sai khác nhỏ (dấu câu, chép lại thiếu một chữ)
    m = SequenceMatcher(None, q, t).find_longest_match(0, len(q), 0, len(t))
    return m.size / max(len(q), 1) >= 0.6


def _owner_found(owner: str, texts: list[str], speakers: list[str]) -> bool:
    if not owner or owner == UNKNOWN:
        return True
    o = norm(re.sub(r"\(.*?\)", "", owner))  # bỏ phần chú thích trong ngoặc
    if not o:
        return True
    hay = norm(" ".join(texts + speakers))
    parts = [p for p in o.split() if p not in {"anh", "chi", "em", "ban", "speaker"} and len(p) > 1]
    return all(p in hay.split() for p in parts) if parts else o in hay


def _deadline_found(deadline: str, texts: list[str]) -> bool:
    if not deadline or deadline == UNKNOWN:
        return True
    words = _words(re.sub(r"\(.*?\)", "", deadline))
    if not words:
        return True
    hay = set(norm(" ".join(texts)).split())
    hit = sum(1 for w in words if w in hay)
    return hit / len(words) >= 0.5


def verify(raw: dict, segments: list[dict]) -> tuple[dict, dict]:
    by_id = {g["id"]: g for g in segments}
    stats = {"total": 0, "passed": 0, "flagged": 0}

    def check(it: dict, action: bool) -> dict:
        stats["total"] += 1
        reasons = []
        sources = [s for s in it.get("sources", []) if s in by_id]
        if not sources:
            reasons.append("Không tìm thấy câu gốc trong transcript")
        texts = [by_id[s]["text"] for s in sources]
        speakers = [by_id[s]["speaker"] for s in sources]
        if sources and not any(_quote_found(it.get("quote", ""), t) for t in texts):
            reasons.append("Câu trích dẫn không khớp với câu gốc")
        owner = (it.get("owner") or UNKNOWN).strip() if action else ""
        deadline = (it.get("deadline") or UNKNOWN).strip() if action else ""
        if action and sources and not _owner_found(owner, texts, speakers):
            reasons.append("Người phụ trách không xuất hiện trong câu gốc")
        if action and sources and not _deadline_found(deadline, texts):
            reasons.append("Deadline không khớp với câu gốc")

        low = it.get("confidence") == "low" or bool(reasons)
        notes = [n for n in [it.get("note", "").strip()] if n and it.get("confidence") == "low"] + reasons
        stats["flagged" if low else "passed"] += 1
        out = {
            "id": uuid.uuid4().hex[:8],
            "text": it.get("text", "").strip(),
            "sources": sources,
            "confidence": "low" if low else "high",
            "confirmed": not low,
        }
        if it.get("topic"):
            out["topic"] = it["topic"]
        if low:
            out["note"] = "; ".join(notes) or "AI chưa chắc chắn"
        if action:
            out["owner"] = owner or UNKNOWN
            out["deadline"] = deadline or UNKNOWN
        return out

    minutes = {
        "summary": [check(i, False) for i in raw.get("summary", [])],
        "decisions": [check(i, False) for i in raw.get("decisions", [])],
        "actions": [check(i, True) for i in raw.get("actions", [])],
        "openIssues": [check(i, False) for i in raw.get("openIssues", [])],
    }
    return minutes, stats
