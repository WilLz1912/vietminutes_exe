"use client";

import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { useNow } from "@/lib/hooks";
import { PROCESSING_MS, STAGES } from "@/lib/store";
import type { Meeting } from "@/lib/types";
import { cn, fmtSize, SOURCE_LABEL } from "@/lib/utils";
import { AuditLog } from "./AuditLog";

// Nhãn bước do AI service trả về (app/jobs.py STAGES), theo thứ tự
const BACKEND_STEPS = [
  "Môi trường 1: chép lời & tách người nói",
  "Môi trường 2: tạo biên bản",
  "Kiểm tra dẫn chiếu câu gốc",
];

type StepState = "done" | "active" | "todo";

function Steps({ steps }: { steps: { label: string; state: StepState }[] }) {
  return (
    <ol className="mt-4 space-y-3">
      {steps.map((s) => (
        <li key={s.label} className="flex items-center gap-3 text-sm">
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center",
              s.state === "done" && "bg-brand-600 text-white",
              s.state === "active" && "border border-brand-600 text-brand-600",
              s.state === "todo" && "border border-gray-300 text-gray-400",
            )}
          >
            {s.state === "done" ? <Check className="h-3.5 w-3.5" /> : s.state === "active" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          </span>
          <span className={cn(s.state === "todo" && "text-gray-400", s.state === "active" && "font-medium")}>{s.label}</span>
        </li>
      ))}
      <li className="flex items-center gap-3 text-sm text-gray-400">
        <span className="flex h-5 w-5 border border-gray-300" />
        Hoàn tất
      </li>
    </ol>
  );
}

export function ProcessingView({ meeting }: { meeting: Meeting }) {
  const now = useNow(200);
  const backend = meeting.engine === "backend";

  let steps: { label: string; state: StepState }[];
  let pct: number;
  if (backend) {
    const idx = BACKEND_STEPS.indexOf(meeting.stage ?? "");
    steps = BACKEND_STEPS.map((label, i) => ({ label, state: i < idx ? "done" : i === idx ? "active" : "todo" }));
    pct = idx < 0 ? 5 : Math.round(((idx + 0.5) / BACKEND_STEPS.length) * 100);
  } else {
    const elapsed = now - (meeting.processingStartedAt ?? now);
    steps = STAGES.map((s, i) => {
      const start = STAGES.slice(0, i).reduce((sum, x) => sum + x.ms, 0);
      const end = start + s.ms;
      return { label: s.label, state: elapsed >= end ? "done" : elapsed >= start ? "active" : "todo" };
    });
    pct = Math.min(99, Math.round((elapsed / PROCESSING_MS) * 100));
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">← Danh sách cuộc họp</Link>
      <Card className="mt-4 p-8">
        <h1 className="text-2xl font-semibold">{meeting.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {SOURCE_LABEL[meeting.source]} · {meeting.fileName} · {fmtSize(meeting.fileSize)}
        </p>
        <div className="mt-6 h-1 bg-gray-200">
          <div className="h-full bg-brand-600 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-right text-xs text-gray-500">{pct}%</div>
        <Steps steps={steps} />
        {backend ? (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="mb-2 text-xs font-semibold uppercase text-gray-500">Nhật ký xử lý & bảo mật (trực tiếp)</div>
            <AuditLog meeting={meeting} />
          </div>
        ) : (
          <p className="mt-6 border-t border-gray-200 pt-4 text-xs text-gray-600">
            Bạn có thể rời trang này – VietMinutes sẽ thông báo khi biên bản sẵn sàng. Chế độ giả lập: chưa kết nối AI service.
          </p>
        )}
      </Card>
    </div>
  );
}
