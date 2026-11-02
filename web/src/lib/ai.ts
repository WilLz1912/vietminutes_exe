"use client";

// Client gọi AI service (D:\EXE\ai). Nếu service không chạy, web tự dùng chế độ giả lập.
import { create } from "zustand";
import type { AuditEntry, GlossaryEntry, Minutes, MeetingInfo, Segment, Speaker, Template } from "./types";

export const AI_URL = process.env.NEXT_PUBLIC_AI_URL ?? "http://localhost:8000";

export interface AiHealth {
  ok: boolean;
  stt: string;
  stt_ready: boolean;
  llm: string;
  llm_ready: boolean;
  sandbox: string;
}

export interface JobResult {
  speakers: Speaker[];
  segments: Segment[];
  minutes: Minutes;
  info: Partial<MeetingInfo>;
  duration: number;
  engine: { stt: string; llm: string };
}

export interface JobState {
  id: string;
  status: "queued" | "stt" | "minutes" | "verify" | "done" | "failed";
  stage: string;
  audit: AuditEntry[];
  result: JobResult | null;
  error: string | null;
}

export const useAiStatus = create<{ health: AiHealth | null; checkedAt: number; check: () => Promise<AiHealth | null> }>(
  (set) => ({
    health: null,
    checkedAt: 0,
    check: async () => {
      try {
        const r = await fetch(`${AI_URL}/health`, { cache: "no-store", signal: AbortSignal.timeout(2000) });
        const h = r.ok ? ((await r.json()) as AiHealth) : null;
        set({ health: h, checkedAt: Date.now() });
        return h;
      } catch {
        set({ health: null, checkedAt: Date.now() });
        return null;
      }
    },
  }),
);

export function backendUsable(h: AiHealth | null): boolean {
  return !!h && h.ok && h.stt_ready && h.llm_ready;
}

export async function submitJob(
  file: Blob,
  fileName: string,
  opts: { template: Template; meetingDate: string; glossary: GlossaryEntry[]; mockScenario: string },
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file, fileName);
  fd.append(
    "request",
    JSON.stringify({
      template: { name: opts.template.name, sections: opts.template.sections },
      meeting_date: opts.meetingDate,
      glossary: opts.glossary.map(({ term, meaning }) => ({ term, meaning })),
      mock_scenario: opts.mockScenario,
    }),
  );
  const r = await fetch(`${AI_URL}/jobs`, { method: "POST", body: fd });
  if (!r.ok) {
    const detail = await r.json().catch(() => null);
    throw new Error(detail?.detail ?? `AI service lỗi ${r.status}`);
  }
  return (await r.json()).id as string;
}

export async function getJob(id: string): Promise<JobState | "gone"> {
  const r = await fetch(`${AI_URL}/jobs/${id}`, { cache: "no-store" });
  if (r.status === 404) return "gone";
  if (!r.ok) throw new Error(`AI service lỗi ${r.status}`);
  return r.json();
}

// Báo server đã nhận kết quả để server xóa ngay khỏi bộ nhớ
export async function ackJob(id: string): Promise<void> {
  await fetch(`${AI_URL}/jobs/${id}`, { method: "DELETE" }).catch(() => undefined);
}
