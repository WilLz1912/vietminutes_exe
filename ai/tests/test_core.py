"""Chạy: .venv/Scripts/python -m unittest discover -s tests"""
import json
import os
import tempfile
import unittest
from pathlib import Path

from app import sandbox
from app.verify import verify

SEGS = [
    {"id": "g1", "speaker": "Speaker 1", "text": "Vậy Nam chốt deadline API tracking là thứ Năm tuần này, ngày 30 nhé."},
    {"id": "g2", "speaker": "Speaker 2", "text": "Dạ ok anh, thứ Năm em xong."},
]


def item(**kw):
    base = {"text": "Hoàn thành API tracking", "sources": ["g1"], "quote": "chốt deadline API tracking", "confidence": "high"}
    return {**base, **kw}


class VerifyTest(unittest.TestCase):
    def run_actions(self, *actions):
        m, stats = verify({"actions": list(actions)}, SEGS)
        return m["actions"], stats

    def test_grounded_action_passes(self):
        (a,), _ = self.run_actions(item(owner="Nam", deadline="Thứ Năm 30/10"))
        self.assertEqual(a["confidence"], "high")
        self.assertTrue(a["confirmed"])

    def test_unknown_source_flagged(self):
        (a,), _ = self.run_actions(item(sources=["g99"], owner="Nam", deadline="thứ Năm"))
        self.assertEqual(a["confidence"], "low")
        self.assertIn("Không tìm thấy câu gốc", a["note"])

    def test_invented_owner_flagged(self):
        (a,), _ = self.run_actions(item(owner="Hùng", deadline="thứ Năm"))
        self.assertIn("Người phụ trách", a["note"])

    def test_invented_deadline_flagged(self):
        (a,), _ = self.run_actions(item(owner="Nam", deadline="15/12"))
        self.assertIn("Deadline", a["note"])

    def test_fake_quote_flagged(self):
        (a,), _ = self.run_actions(item(quote="khách hàng yêu cầu hoàn tiền", owner="Nam", deadline="thứ Năm"))
        self.assertIn("trích dẫn", a["note"])

    def test_model_low_confidence_kept(self):
        (a,), stats = self.run_actions(item(owner="Nam", deadline="thứ Năm", confidence="low", note="Mơ hồ"))
        self.assertEqual(a["note"], "Mơ hồ")
        self.assertEqual(stats["flagged"], 1)


class SandboxTest(unittest.TestCase):
    def test_isolation_and_cleanup(self):
        probe = Path(tempfile.mkdtemp()) / "probe.py"
        probe.write_text(
            "import json, os, pathlib\n"
            "pathlib.Path('output.json').write_text(json.dumps({'cwd': os.getcwd(), 'env': sorted(os.environ),"
            " 'files': sorted(os.listdir('.'))}))\n",
            encoding="utf-8",
        )
        os.environ["GEMINI_API_KEY"] = "should-not-leak"
        old = sandbox.WORKERS["stt"]
        sandbox.WORKERS["stt"] = probe
        log = []
        try:
            src = probe.parent / "a.wav"
            src.write_bytes(b"x")
            out = sandbox.run("stt", {"x": 1}, {"a.wav": src}, {"SONIOX_API_KEY": "k"}, 30, log.append)
        finally:
            sandbox.WORKERS["stt"] = old
            os.environ.pop("GEMINI_API_KEY")
        self.assertIn("SONIOX_API_KEY", out["env"])
        self.assertNotIn("GEMINI_API_KEY", out["env"])  # hộp STT không thấy key của LLM
        self.assertEqual(out["files"], ["a.wav", "input.json"])  # chỉ có đúng đầu vào của bước
        self.assertFalse(Path(out["cwd"]).exists())  # hộp đã bị xóa
        self.assertIn("đã xóa sạch", log[-1])


if __name__ == "__main__":
    unittest.main()
