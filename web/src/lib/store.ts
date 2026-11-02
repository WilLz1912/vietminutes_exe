"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SCENARIOS, scenarioForTemplate, type Scenario } from "./scenarios";
import type { JobState } from "./ai";
import type { DeletionLog, Engine, GlossaryEntry, Meeting, MeetingSource, Plan } from "./types";
import { uid } from "./utils";

const DAY = 24 * 60 * 60 * 1000;
export const RETENTION_DAYS = 7;
export const PLAN_LIMIT: Record<Plan, number> = { free: 3, premium: 15 };

// Thời gian giả lập từng bước xử lý (ms) — thay bằng trạng thái job thật khi có backend
export const STAGES = [
  { key: "upload", label: "Đang tải lên", ms: 1500 },
  { key: "transcribe", label: "Đang chép lời & tách người nói", ms: 3500 },
  { key: "minutes", label: "Đang tạo biên bản", ms: 2500 },
] as const;
export const PROCESSING_MS = STAGES.reduce((s, x) => s + x.ms, 0);

interface User {
  name: string;
  email: string;
}

interface NewMeetingInput {
  title: string;
  templateId: string;
  source: MeetingSource;
  fileName: string;
  fileSize: number;
  duration: number;
  engine: Engine;
  startedAt?: number; // thời điểm bắt đầu họp (ước tính từ file/ghi âm)
  jobId?: string;
}

interface State {
  user: User | null;
  onboarded: boolean;
  tourStep: number | null; // bước hướng dẫn đang hiện, null = không hiện
  consentAt?: number;
  extensionInstalled: boolean;
  defaultTemplateId: string;
  plan: Plan;
  meetings: Meeting[];
  glossary: GlossaryEntry[];
  deletionLogs: DeletionLog[];

  login: () => void;
  logout: () => void;
  completeOnboarding: (templateId: string, extensionInstalled: boolean) => void;
  setTourStep: (step: number | null) => void;
  setDefaultTemplate: (id: string) => void;
  setExtensionInstalled: (v: boolean) => void;
  createMeeting: (input: NewMeetingInput) => string;
  finishProcessing: (id: string) => void;
  applyJob: (id: string, job: JobState) => void;
  failMeeting: (id: string, error: string) => void;
  updateMeeting: (id: string, fn: (m: Meeting) => Meeting) => void;
  deleteMeeting: (id: string) => void;
  deleteAllData: () => void;
  addGlossary: (term: string, meaning: string) => void;
  removeGlossary: (id: string) => void;
  setPlan: (p: Plan) => void;
}

function fromScenario(sc: Scenario, base: Partial<Meeting>): Meeting {
  const now = Date.now();
  const lastSeg = sc.segments[sc.segments.length - 1];
  return {
    id: uid(),
    title: sc.defaultTitle,
    createdAt: now,
    meetingDate: new Date(now).toISOString().slice(0, 10),
    duration: lastSeg ? lastSeg.end : 0,
    source: "upload",
    fileName: "cuoc-hop.m4a",
    fileSize: 0,
    templateId: sc.templateId,
    status: "draft",
    scenario: sc.id,
    info: { ...sc.info },
    speakers: sc.speakers.map((s) => ({ ...s })),
    segments: sc.segments.map((s) => ({ ...s })),
    minutes: structuredClone(sc.minutes),
    audioExpiresAt: now + RETENTION_DAYS * DAY,
    engine: "mock",
    ...base,
  };
}

function sampleMeetings(): Meeting[] {
  const now = Date.now();
  const weekly = fromScenario(SCENARIOS.weekly, {
    createdAt: now - 3 * DAY,
    meetingDate: new Date(now - 3 * DAY).toISOString().slice(0, 10),
    fileName: "giao-ban-tuan-43.m4a",
    fileSize: 18_400_000,
    sample: true,
    audioExpiresAt: now + 4 * DAY,
  });
  // biên bản mẫu đã duyệt: mọi mục đã được xác nhận, người nói đã đổi tên
  weekly.speakers = weekly.speakers.map((s, i) => ({ ...s, name: ["Anh Quân", "Mai", "Tuấn", "Chị Thảo"][i], suggested: undefined }));
  weekly.info.chair = "Anh Quân";
  weekly.info.secretary = "Mai";
  for (const key of ["summary", "decisions", "actions", "openIssues"] as const) {
    weekly.minutes[key].forEach((it) => (it.confirmed = true));
  }
  weekly.minutes.actions[1].owner = "Chị Thảo";
  weekly.status = "approved";
  weekly.approvedAt = now - 3 * DAY + 3600_000;

  const client = fromScenario(SCENARIOS.client, {
    createdAt: now - 1 * DAY,
    meetingDate: new Date(now - DAY).toISOString().slice(0, 10),
    fileName: "hop-ngoc-lan.mp3",
    fileSize: 9_200_000,
    sample: true,
    audioExpiresAt: now + 6 * DAY,
  });
  return [client, weekly];
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      user: null,
      onboarded: false,
      tourStep: null,
      extensionInstalled: false,
      defaultTemplateId: "project",
      plan: "free",
      meetings: [],
      glossary: [
        { id: uid(), term: "VM", meaning: "VietMinutes" },
        { id: uid(), term: "PIC", meaning: "Person in charge – người phụ trách" },
      ],
      deletionLogs: [],

      login: () =>
        set((s) => ({
          user: { name: "Lê Sỹ Minh Quang", email: "quang@congty-demo.vn" },
          meetings: s.meetings.length ? s.meetings : sampleMeetings(),
        })),
      logout: () => set({ user: null }),
      completeOnboarding: (templateId, extensionInstalled) =>
        set({ onboarded: true, consentAt: Date.now(), defaultTemplateId: templateId, extensionInstalled }),
      setDefaultTemplate: (id) => set({ defaultTemplateId: id }),
      setExtensionInstalled: (v) => set({ extensionInstalled: v }),

      createMeeting: (input) => {
        const sc = scenarioForTemplate(input.templateId);
        const m = fromScenario(sc, {
          title: input.title || sc.defaultTitle,
          templateId: input.templateId,
          source: input.source,
          fileName: input.fileName,
          fileSize: input.fileSize,
          status: "processing",
          processingStartedAt: Date.now(),
          engine: input.engine,
          jobId: input.jobId,
        });
        if (input.duration > 0) m.duration = input.engine === "mock" ? Math.max(m.duration, Math.round(input.duration)) : Math.round(input.duration);
        if (input.engine === "backend") {
          // dữ liệu thật sẽ do AI service trả về
          m.speakers = [];
          m.segments = [];
          m.minutes = { summary: [], decisions: [], actions: [], openIssues: [] };
          m.info = { purpose: "", startTime: "", chair: "", secretary: "", location: "", attendees: "" };
          m.stage = "Đang gửi lên AI service";
          m.audit = [];
        }
        if (input.startedAt) {
          const d = new Date(input.startedAt);
          const pad = (n: number) => String(n).padStart(2, "0");
          m.meetingDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
          m.info.startTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }
        set((s) => ({ meetings: [m, ...s.meetings] }));
        return m.id;
      },
      finishProcessing: (id) =>
        get().updateMeeting(id, (m) => (m.status === "processing" ? { ...m, status: "draft" } : m)),
      applyJob: (id, job) =>
        get().updateMeeting(id, (m) => {
          if (m.status !== "processing") return m;
          const base = { ...m, stage: job.stage, audit: job.audit };
          if (job.status === "failed") return { ...base, status: "failed", error: job.error ?? "Lỗi không rõ" };
          if (job.status !== "done" || !job.result) return base;
          const r = job.result;
          return {
            ...base,
            status: "draft",
            speakers: r.speakers,
            segments: r.segments,
            minutes: r.minutes,
            info: { ...m.info, ...r.info },
            duration: Math.max(m.duration, Math.round(r.duration)),
          };
        }),
      failMeeting: (id, error) =>
        get().updateMeeting(id, (m) => (m.status === "processing" ? { ...m, status: "failed", error } : m)),
      updateMeeting: (id, fn) => set((s) => ({ meetings: s.meetings.map((m) => (m.id === id ? fn(m) : m)) })),
      deleteMeeting: (id) =>
        set((s) => {
          const m = s.meetings.find((x) => x.id === id);
          return {
            meetings: s.meetings.filter((x) => x.id !== id),
            deletionLogs: m
              ? [{ id: uid(), at: Date.now(), what: `Xóa vĩnh viễn audio, transcript và biên bản "${m.title}"` }, ...s.deletionLogs]
              : s.deletionLogs,
          };
        }),
      deleteAllData: () =>
        set((s) => ({
          meetings: [],
          deletionLogs: [
            { id: uid(), at: Date.now(), what: `Xóa toàn bộ dữ liệu (${s.meetings.length} cuộc họp)` },
            ...s.deletionLogs,
          ],
        })),
      addGlossary: (term, meaning) => set((s) => ({ glossary: [...s.glossary, { id: uid(), term, meaning }] })),
      removeGlossary: (id) => set((s) => ({ glossary: s.glossary.filter((g) => g.id !== id) })),
      setPlan: (plan) => set({ plan }),
      setTourStep: (tourStep) => set({ tourStep }),
    }),
    { name: "vietminutes-demo" },
  ),
);

export function usageThisMonth(meetings: Meeting[]): number {
  const now = new Date();
  return meetings.filter((m) => {
    const d = new Date(m.createdAt);
    return !m.sample && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
}

export function pendingCount(m: Meeting): number {
  const { summary, decisions, actions, openIssues } = m.minutes;
  return [...summary, ...decisions, ...actions, ...openIssues].filter((i) => !i.confirmed).length;
}
