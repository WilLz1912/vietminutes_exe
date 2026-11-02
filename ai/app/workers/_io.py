"""Tiện ích chung cho code chạy BÊN TRONG hộp: chỉ đọc/ghi trong thư mục hộp hiện tại."""
import json
import sys
import traceback
from pathlib import Path

BOX = Path.cwd()


def read_input() -> dict:
    return json.loads((BOX / "input.json").read_text(encoding="utf-8"))


def write_output(data: dict) -> None:
    (BOX / "output.json").write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def guarded(main) -> None:
    try:
        main()
    except Exception as e:  # chỉ in loại lỗi + thông điệp ngắn, không in dữ liệu cuộc họp
        traceback.print_exc(limit=1, file=sys.stderr)
        print(f"{type(e).__name__}: {str(e)[:300]}", file=sys.stderr)
        sys.exit(1)
