"""Cấu hình đọc từ biến môi trường / file .env (không cần thư viện ngoài)."""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load_dotenv() -> None:
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


_load_dotenv()


def get(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


STT_PROVIDER = get("STT_PROVIDER", "mock")
LLM_PROVIDER = get("LLM_PROVIDER", "mock")
SANDBOX_TIMEOUT_STT = int(get("SANDBOX_TIMEOUT_STT", "900"))
SANDBOX_TIMEOUT_LLM = int(get("SANDBOX_TIMEOUT_LLM", "300"))
RESULT_TTL = int(get("RESULT_TTL", "900"))
WEB_ORIGIN = get("WEB_ORIGIN", "http://localhost:3000")

# Mỗi hộp chỉ được nhận đúng secret của bước mình (quyền tối thiểu)
STT_SECRETS = {
    "mock": {},
    "soniox": {"SONIOX_API_KEY": get("SONIOX_API_KEY"), "SONIOX_MODEL": get("SONIOX_MODEL", "stt-async-v5")},
    "deepgram": {"DEEPGRAM_API_KEY": get("DEEPGRAM_API_KEY"), "DEEPGRAM_MODEL": get("DEEPGRAM_MODEL", "nova-3")},
}
LLM_SECRETS = {
    "mock": {},
    "gemini": {"GEMINI_API_KEY": get("GEMINI_API_KEY"), "GEMINI_MODEL": get("GEMINI_MODEL", "gemini-3.8-flash")},
}


def provider_ready() -> dict:
    stt_ok = all(STT_SECRETS.get(STT_PROVIDER, {"x": ""}).values()) if STT_PROVIDER != "mock" else True
    llm_ok = all(LLM_SECRETS.get(LLM_PROVIDER, {"x": ""}).values()) if LLM_PROVIDER != "mock" else True
    return {"stt": STT_PROVIDER, "stt_ready": stt_ok, "llm": LLM_PROVIDER, "llm_ready": llm_ok}
