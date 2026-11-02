"""MÔI TRƯỜNG 2 – nhận transcript (KHÔNG có audio), trả về biên bản dạng JSON.

LLM không có công cụ nào: chỉ đọc văn bản và trả JSON, nên câu "lệnh" chèn trong cuộc họp
(prompt injection) không thể khiến hệ thống làm gì ngoài việc điền biên bản.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.providers import llm  # noqa: E402
from app.workers._io import guarded, read_input, write_output  # noqa: E402


def main() -> None:
    inp = read_input()
    provider = inp["provider"]
    if provider == "mock":
        minutes = llm.mock(inp)
    elif provider == "gemini":
        minutes = llm.gemini(inp)
    else:
        raise ValueError(f"LLM provider không hỗ trợ: {provider}")
    write_output({"minutes": minutes})


if __name__ == "__main__":
    guarded(main)
