import type { Meeting, MeetingSource, MeetingStatus } from "./types";

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function cn(...xs: (string | false | null | undefined)[]): string {
  return xs.filter(Boolean).join(" ");
}

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(r).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function fmtDuration(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 1) return `${Math.round(sec)} giây`;
  if (m < 60) return `${m} phút`;
  return `${Math.floor(m / 60)} giờ ${m % 60} phút`;
}

// "14:00" + thời lượng (giây) -> "14:45"
export function endTime(start: string, durationSec: number): string {
  const [h, m] = start.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  const total = h * 60 + m + Math.round(durationSec / 60);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function fmtDate(v: number | string): string {
  const d = new Date(v);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtDateTime(v: number): string {
  const d = new Date(v);
  return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ${fmtDate(v)}`;
}

export function fmtSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function vnd(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

export function speakerName(m: Meeting, speakerId: string): string {
  const s = m.speakers.find((x) => x.id === speakerId);
  if (!s) return "?";
  return s.name || s.label;
}

// ô màu nhỏ phân biệt người nói (không dùng nền màu cho chữ)
const SPEAKER_COLORS = ["bg-sky-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"];

export function speakerColor(m: Meeting, speakerId: string): string {
  const i = m.speakers.findIndex((x) => x.id === speakerId);
  return SPEAKER_COLORS[(i < 0 ? 0 : i) % SPEAKER_COLORS.length];
}

export const STATUS_LABEL: Record<MeetingStatus, string> = {
  processing: "Đang xử lý",
  draft: "Bản nháp",
  approved: "Đã duyệt",
  failed: "Lỗi xử lý",
};

export const SOURCE_LABEL: Record<MeetingSource, string> = {
  upload: "Tải file",
  record: "Thu âm trên Web",
  extension: "Google Meet (Extension)",
};

export const ACCEPTED_EXT = [".mp3", ".wav", ".m4a", ".webm"];
export const MAX_FILE_MB = 100;

export function validateAudio(file: File): string | null {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXT.some((e) => name.endsWith(e))) {
    return `Định dạng không hỗ trợ. Chỉ nhận ${ACCEPTED_EXT.join(", ")}.`;
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `File quá dung lượng (${fmtSize(file.size)}). Tối đa ${MAX_FILE_MB} MB.`;
  }
  return null;
}

export function titleFromFile(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}
