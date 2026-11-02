"use client";

import { AlertTriangle, FileAudio, Mic, ShieldCheck, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { backendUsable, submitJob, useAiStatus } from "@/lib/ai";
import { readDuration, setAudio } from "@/lib/audio";
import { scenarioForTemplate } from "@/lib/scenarios";
import { PLAN_LIMIT, usageThisMonth, useStore } from "@/lib/store";
import { getTemplate, TEMPLATES } from "@/lib/templates";
import type { MeetingSource } from "@/lib/types";
import { fmtDuration, fmtSize, fmtTime, titleFromFile, validateAudio } from "@/lib/utils";
import { toast } from "./Toaster";
import { Button, Field, inputCls, Modal } from "./ui";

interface Pending {
  blob: Blob;
  name: string;
  source: MeetingSource;
}

export function useQuota() {
  const plan = useStore((s) => s.plan);
  const meetings = useStore((s) => s.meetings);
  const used = usageThisMonth(meetings);
  return { used, limit: PLAN_LIMIT[plan], plan, exceeded: used >= PLAN_LIMIT[plan] };
}

export function UpgradeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { used, limit, plan } = useQuota();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bạn đã dùng hết hạn mức tháng này"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Để sau</Button>
          {plan === "free" && (
            <Link href="/billing" className="inline-flex h-9 items-center bg-brand-600 px-3.5 text-sm font-medium text-white hover:bg-brand-700">
              Nâng cấp Premium
            </Link>
          )}
        </>
      }
    >
      <p className="text-sm text-gray-600">
        Gói {plan === "free" ? "Free" : "Premium"} gồm {limit} biên bản/tháng và bạn đã dùng {used}/{limit}.
        {plan === "free"
          ? " Nâng cấp Premium để có 15 biên bản/tháng."
          : " Biên bản vượt hạn mức sẽ được tính phí bổ sung (tính năng mua thêm lượt sẽ có trong bản chính thức)."}
      </p>
    </Modal>
  );
}

function EngineNote() {
  const health = useAiStatus((s) => s.health);
  if (backendUsable(health)) {
    return (
      <div className="flex items-start gap-2 rounded-md bg-gray-50 p-3 text-xs text-gray-700">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span>
          Xử lý bằng AI service: chép lời <b>{health!.stt}</b> trong hộp 1, tạo biên bản <b>{health!.llm}</b> trong hộp 2. Mỗi hộp tự hủy
          ngay khi xong; file ghi âm bị xóa khỏi máy chủ sau khi chép lời.
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        {health ? "AI service chưa có API key cho provider đang chọn" : "Chưa kết nối AI service"} – dùng chế độ giả lập trên trình duyệt.
      </span>
    </div>
  );
}

function NewMeetingForm({ pending, onClose }: { pending: Pending; onClose: () => void }) {
  const router = useRouter();
  const defaultTpl = useStore((s) => s.defaultTemplateId);
  const glossary = useStore((s) => s.glossary);
  const create = useStore((s) => s.createMeeting);
  const checkAi = useAiStatus((s) => s.check);
  const [title, setTitle] = useState(() =>
    pending.source === "upload" ? titleFromFile(pending.name) : `Cuộc họp ${new Date().toLocaleDateString("vi-VN")}`,
  );
  const [tpl, setTpl] = useState(defaultTpl);
  const [duration, setDuration] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    readDuration(pending.blob).then(setDuration);
    checkAi();
  }, [pending, checkAi]);

  const submit = async () => {
    setSending(true);
    const base = {
      title: title.trim(),
      templateId: tpl,
      source: pending.source,
      fileName: pending.name,
      fileSize: pending.blob.size,
      duration,
      // giờ bắt đầu họp: thời điểm kết thúc ghi (thu âm ngay / ngày sửa file) trừ thời lượng
      startedAt: (pending.blob instanceof File ? pending.blob.lastModified : Date.now()) - duration * 1000,
    };
    let id: string;
    if (backendUsable(await checkAi())) {
      try {
        const jobId = await submitJob(pending.blob, pending.name, {
          template: getTemplate(tpl),
          meetingDate: new Date().toISOString().slice(0, 10),
          glossary,
          mockScenario: scenarioForTemplate(tpl).id,
        });
        id = create({ ...base, engine: "backend", jobId });
      } catch (e) {
        setSending(false);
        toast.error(`Không gửi được lên AI service: ${(e as Error).message}`);
        return;
      }
    } else {
      id = create({ ...base, engine: "mock" });
    }
    setAudio(id, pending.blob);
    onClose();
    router.push(`/meetings/${id}`);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Thông tin cuộc họp"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} disabled={!title.trim() || sending}>
            {sending ? "Đang gửi…" : "Bắt đầu xử lý"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 border border-gray-200 bg-gray-50 p-3 text-sm">
          <FileAudio className="h-6 w-6 text-gray-500" />
          <div className="min-w-0">
            <div className="truncate font-medium">{pending.name}</div>
            <div className="text-xs text-gray-500">
              {fmtSize(pending.blob.size)}
              {duration > 0 && ` · ${fmtDuration(duration)}`}
            </div>
          </div>
        </div>
        <Field label="Tên cuộc họp">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </Field>
        <Field label="Mẫu biên bản" hint="Có thể đổi mẫu sau khi xử lý xong.">
          <select className={inputCls} value={tpl} onChange={(e) => setTpl(e.target.value)}>
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
        <EngineNote />
      </div>
    </Modal>
  );
}

function RecordDialog({ onClose, onDone }: { onClose: () => void; onDone: (p: Pending) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "denied">("idle");
  const [elapsed, setElapsed] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // tắt micro nếu dialog bị đóng khi đang thu
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      const rec = recRef.current;
      if (rec) {
        rec.onstop = null;
        rec.stream.getTracks().forEach((t) => t.stop());
      }
    },
    [],
  );

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
        const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
        onDone({ blob, name: `thu-am-${stamp}.webm`, source: "record" });
      };
      rec.start(1000);
      recRef.current = rec;
      const t0 = Date.now();
      timer.current = setInterval(() => setElapsed((Date.now() - t0) / 1000), 250);
      setState("recording");
    } catch {
      setState("denied");
    }
  };

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    recRef.current?.stop();
    recRef.current?.stream.getTracks().forEach((t) => t.stop());
    recRef.current = null;
    setState("idle");
    onClose();
  };

  return (
    <Modal open onClose={() => (state === "recording" ? toast.info("Bấm Dừng để kết thúc thu âm.") : onClose())} title="Thu âm trực tiếp">
      <div className="flex flex-col items-center py-4 text-center">
        <div className="mb-4 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-left text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Hãy thông báo cho mọi người trong cuộc họp rằng bạn đang ghi âm.
        </div>
        <div className="font-mono text-4xl tabular-nums">{fmtTime(elapsed)}</div>
        <div className="mt-1 text-xs text-gray-500">
          {state === "recording" ? "Đang thu âm từ micro…" : state === "denied" ? "" : "Sẵn sàng"}
        </div>
        {state === "denied" && (
          <p className="mt-2 text-sm text-red-600">
            Không truy cập được micro. Hãy cho phép quyền micro trên trình duyệt rồi thử lại.
          </p>
        )}
        <div className="mt-6">
          {state === "recording" ? (
            <button onClick={stop} className="rec-pulse flex h-16 w-16 items-center justify-center rounded-full bg-seal text-white">
              <Square className="h-6 w-6 fill-white" />
            </button>
          ) : (
            <button onClick={start} className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-gray-700">
              <Mic className="h-7 w-7" />
            </button>
          )}
        </div>
        <div className="mt-3 text-sm text-gray-600">{state === "recording" ? "Dừng & tạo biên bản" : "Bắt đầu thu âm"}</div>
      </div>
    </Modal>
  );
}

export function useNewMeetingFlow() {
  const quota = useQuota();
  const [pending, setPending] = useState<Pending | null>(null);
  const [recording, setRecording] = useState(false);
  const [upgrade, setUpgrade] = useState(false);

  const startUpload = (file: File) => {
    const err = validateAudio(file);
    if (err) return toast.error(err);
    if (quota.exceeded) return setUpgrade(true);
    setPending({ blob: file, name: file.name, source: "upload" });
  };
  const startRecord = () => {
    if (quota.exceeded) return setUpgrade(true);
    setRecording(true);
  };

  const dialogs = (
    <>
      {pending && <NewMeetingForm pending={pending} onClose={() => setPending(null)} />}
      {recording && <RecordDialog onClose={() => setRecording(false)} onDone={(p) => setPending(p)} />}
      <UpgradeDialog open={upgrade} onClose={() => setUpgrade(false)} />
    </>
  );
  return { startUpload, startRecord, dialogs };
}
