"""MÔI TRƯỜNG 1 – chỉ chép lời + tách người nói. Nhận audio, trả về các đoạn transcript.

Không nhận mẫu biên bản, không nhận từ điển, không có key của LLM.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # chạy với `python -I` nên tự thêm gốc dự án

from app.providers import stt  # noqa: E402
from app.workers._io import BOX, guarded, read_input, write_output  # noqa: E402


def main() -> None:
    inp = read_input()
    audio = BOX / inp["audio_name"]
    provider = inp["provider"]
    if provider == "mock":
        segments = stt.mock(inp.get("mock_scenario", "sprint"))
    elif provider == "soniox":
        segments = stt.soniox(audio)
    elif provider == "deepgram":
        segments = stt.deepgram(audio)
    else:
        raise ValueError(f"STT provider không hỗ trợ: {provider}")
    write_output({"segments": segments})


if __name__ == "__main__":
    guarded(main)
