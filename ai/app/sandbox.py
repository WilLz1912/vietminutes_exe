"""Chạy một bước xử lý trong "hộp" dùng một lần.

Mức MVP (chạy được trên máy dev Windows/Linux, không cần Docker):
- mỗi lần chạy là một tiến trình Python riêng (`python -I`), không dùng chung bộ nhớ với server;
- thư mục làm việc tạm riêng, chỉ chứa đúng file đầu vào của bước đó, bị xóa ngay khi xong;
- biến môi trường dựng lại từ đầu: chỉ có secret của bước đó, không thừa hưởng key của bước khác;
- có timeout, quá hạn thì kill tiến trình.
Bước sau MVP: thay `_spawn` bằng container (không ổ đĩa lâu dài, mạng chỉ tới API được phép).
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path

from .config import ROOT

WORKERS = {
    "stt": ROOT / "app" / "workers" / "stt_worker.py",
    "minutes": ROOT / "app" / "workers" / "minutes_worker.py",
}


class SandboxError(RuntimeError):
    pass


def _base_env(box: Path) -> dict:
    env = {
        "TEMP": str(box),
        "TMP": str(box),
        "TMPDIR": str(box),
        "HOME": str(box),
        "USERPROFILE": str(box),
        "PYTHONIOENCODING": "utf-8",
        "PATH": os.environ.get("PATH", ""),
    }
    # Windows cần SYSTEMROOT để mở socket mạng
    for k in ("SYSTEMROOT", "SystemRoot", "WINDIR"):
        if k in os.environ:
            env[k] = os.environ[k]
    return env


def run(stage: str, payload: dict, files: dict[str, Path], secrets: dict[str, str], timeout: int, audit) -> dict:
    """Chạy `stage` trong hộp mới. `files`: tên trong hộp -> đường dẫn nguồn (được copy vào hộp)."""
    box_id = uuid.uuid4().hex[:8]
    box = Path(tempfile.mkdtemp(prefix=f"vm-{stage}-{box_id}-"))
    audit(f"Khởi tạo hộp #{box_id} cho bước {stage} (tiến trình riêng, thư mục tạm riêng, chỉ có key của bước này)")
    t0 = time.time()
    try:
        for name, src in files.items():
            shutil.copyfile(src, box / name)
        (box / "input.json").write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")

        env = _base_env(box)
        env.update({k: v for k, v in secrets.items() if v})
        try:
            proc = subprocess.run(
                [sys.executable, "-I", str(WORKERS[stage])],
                cwd=box,
                env=env,
                capture_output=True,
                timeout=timeout,
            )
        except subprocess.TimeoutExpired:
            raise SandboxError(f"Bước {stage} quá thời gian {timeout}s – tiến trình đã bị kill")

        out = box / "output.json"
        if proc.returncode != 0 or not out.exists():
            # chỉ lấy dòng lỗi cuối, không đưa nội dung cuộc họp ra log
            err = proc.stderr.decode("utf-8", "replace").strip().splitlines()
            raise SandboxError(f"Bước {stage} lỗi: {err[-1] if err else 'không có output'}")
        return json.loads(out.read_text(encoding="utf-8"))
    finally:
        shutil.rmtree(box, ignore_errors=True)
        gone = not box.exists()
        audit(f"Hủy hộp #{box_id} sau {time.time() - t0:.1f}s – {'đã xóa sạch thư mục tạm' if gone else 'CẢNH BÁO: chưa xóa được thư mục tạm'}")
