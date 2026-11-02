"use client";

import { AlertTriangle, ArrowLeft, Check, ChevronDown, Download, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AuditLog } from "@/components/meeting/AuditLog";
import { MinutesPanel } from "@/components/meeting/MinutesPanel";
import { ProcessingView } from "@/components/meeting/ProcessingView";
import { TranscriptPanel } from "@/components/meeting/TranscriptPanel";
import { usePlayer } from "@/components/meeting/usePlayer";
import { toast } from "@/components/Toaster";
import { Button, Card, Modal, StatusBadge } from "@/components/ui";
import { dropAudio } from "@/lib/audio";
import { exportDocx } from "@/lib/exportDocx";
import { pendingCount, useStore } from "@/lib/store";
import { TEMPLATES } from "@/lib/templates";
import type { Meeting } from "@/lib/types";
import { cn, fmtDate, fmtDuration } from "@/lib/utils";

const allItems = (m: Meeting) => [...m.minutes.summary, ...m.minutes.decisions, ...m.minutes.actions, ...m.minutes.openIssues];

// đổi tên hiển thị của một người nói trong toàn bộ biên bản
function renameIn(m: Meeting, speakerId: string, name: string): Meeting {
  const s = m.speakers.find((x) => x.id === speakerId)!;
  const oldDisplay = s.name || s.label;
  const newDisplay = name || s.label;
  const swap = (v: string) => (oldDisplay && v.includes(oldDisplay) ? v.split(oldDisplay).join(newDisplay) : v);
  return {
    ...m,
    speakers: m.speakers.map((x) => (x.id === speakerId ? { ...x, name, suggested: undefined } : x)),
    info: { ...m.info, chair: swap(m.info.chair), secretary: swap(m.info.secretary) },
    minutes: { ...m.minutes, actions: m.minutes.actions.map((a) => ({ ...a, owner: swap(a.owner) })) },
  };
}

function Editor({ meeting }: { meeting: Meeting }) {
  const update = useStore((s) => s.updateMeeting);
  const total = Math.max(meeting.duration, meeting.segments.at(-1)?.end ?? 0);
  const { player, audioRef } = usePlayer(meeting.id, total);
  const [highlight, setHighlight] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [exportFmt, setExportFmt] = useState<"docx" | "pdf" | null>(null);
  const [exportMenu, setExportMenu] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [justApproved, setJustApproved] = useState(false);
  const readOnly = meeting.status === "approved";
  const pending = pendingCount(meeting);
  const flagged = allItems(meeting).filter((i) => i.confidence === "low").length;
  const suggestions = meeting.speakers.filter((s) => s.suggested && !s.name);

  const change = useCallback(
    (fn: (m: Meeting) => Meeting) => {
      update(meeting.id, fn);
      setSavedAt(Date.now());
    },
    [update, meeting.id],
  );

  const cite = (ids: string[]) => {
    setHighlight(ids);
    const seg = meeting.segments.find((g) => g.id === ids[0]);
    if (!seg) return;
    player.seek(seg.start);
    document.getElementById(`seg-${seg.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const rename = (speakerId: string, name: string) => {
    change((m) => renameIn(m, speakerId, name));
    toast.success("Đã đổi tên trong toàn bộ transcript và biên bản.");
  };

  const applySuggestions = () => {
    change((m) => suggestions.reduce((acc, s) => renameIn(acc, s.id, s.suggested!), m));
    toast.success(`Đã áp dụng tên cho ${suggestions.length} người nói.`);
  };

  // nhảy tới mục chưa xác nhận kế tiếp (đọc state mới nhất từ store)
  const goNextPending = () => {
    const latest = useStore.getState().meetings.find((m) => m.id === meeting.id);
    const next = latest && allItems(latest).find((i) => !i.confirmed);
    if (!next) return;
    const el = document.getElementById(`item-${next.id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.classList.remove("flash");
    void el?.offsetWidth;
    el?.classList.add("flash");
    cite(next.sources);
  };

  const approve = () => {
    change((m) => ({ ...m, status: "approved", approvedAt: Date.now() }));
    setJustApproved(true);
  };

  const doExport = async (fmt: "docx" | "pdf") => {
    setExportFmt(null);
    setExportMenu(false);
    setJustApproved(false);
    if (fmt === "docx") {
      await exportDocx(meeting);
      toast.success("Đã tải file Word (.docx).");
    } else {
      window.open(`/print/${meeting.id}`, "_blank");
    }
  };

  const requestExport = (fmt: "docx" | "pdf") => (meeting.status === "approved" ? doExport(fmt) : setExportFmt(fmt));

  // Bước hiện tại của luồng: 1 Rà soát -> 2 Duyệt -> 3 Xuất. Chỉ một nút chính cho bước đó.
  const step = readOnly ? 3 : pending > 0 ? 1 : 2;
  const primary =
    step === 3 ? (
      <Button onClick={() => doExport("docx")}>
        <Download className="h-4 w-4" /> Tải Word
      </Button>
    ) : step === 1 ? (
      <Button onClick={goNextPending}>Xem mục cần xác nhận ({pending})</Button>
    ) : (
      <Button onClick={approve}>
        <Check className="h-4 w-4" /> Duyệt biên bản
      </Button>
    );
  const STEPS = ["Rà soát", "Duyệt", "Xuất file"];

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex min-w-[240px] flex-1 items-center gap-2">
            <Link href="/dashboard" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Về danh sách">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <input
              value={meeting.title}
              disabled={readOnly}
              onChange={(e) => change((m) => ({ ...m, title: e.target.value }))}
              className="min-w-0 flex-1 rounded-md bg-transparent px-1 text-lg font-semibold outline-none hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-100 disabled:hover:bg-transparent"
            />
            <StatusBadge status={meeting.status} />
          </div>
          <div data-tour="steps" className="flex items-center gap-x-4 rounded-lg">
            <ol className="hidden items-center gap-1 text-xs lg:flex">
              {STEPS.map((label, i) => (
                <li key={label} className="flex items-center gap-1">
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1",
                      i + 1 < step && "text-emerald-700",
                      i + 1 === step && "bg-brand-50 font-medium text-brand-700",
                      i + 1 > step && "text-gray-400",
                    )}
                  >
                    {i + 1 < step ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
                    {label}
                  </span>
                  {i < STEPS.length - 1 && <span className="text-gray-300">›</span>}
                </li>
              ))}
            </ol>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setShowAudit(true)} title="Nhật ký xử lý & bảo mật">
                <ShieldCheck className="h-4 w-4" />
              </Button>
              <div className="relative">
                <Button variant="secondary" onClick={() => setExportMenu((v) => !v)}>
                  Xuất <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                {exportMenu && (
                  <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-md border border-gray-200 bg-white text-sm shadow-lg" onMouseLeave={() => setExportMenu(false)}>
                    <button className="block w-full px-3 py-2 text-left hover:bg-gray-50" onClick={() => requestExport("docx")}>
                      Word (.docx)
                    </button>
                    <button className="block w-full px-3 py-2 text-left hover:bg-gray-50" onClick={() => requestExport("pdf")}>
                      PDF
                    </button>
                  </div>
                )}
              </div>
              {primary}
            </div>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-8 text-xs text-gray-500">
          <span>{fmtDate(meeting.meetingDate)}</span>
          <span>·</span>
          <span>{fmtDuration(meeting.duration)}</span>
          <span>·</span>
          <label className="flex items-center gap-1">
            Mẫu
            <select
              disabled={readOnly}
              value={meeting.templateId}
              onChange={(e) => change((m) => ({ ...m, templateId: e.target.value }))}
              className="rounded bg-transparent text-xs font-medium text-gray-700 outline-none hover:bg-gray-100"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <span>·</span>
          <span>{meeting.engine === "backend" ? "AI service" : "Chế độ giả lập"}</span>
          {savedAt && !readOnly && (
            <>
              <span>·</span>
              <span>Đã lưu tự động</span>
            </>
          )}
          {readOnly && (
            <button onClick={() => change((m) => ({ ...m, status: "draft", approvedAt: undefined }))} className="ml-auto font-medium text-brand-600 hover:underline">
              Mở lại để sửa
            </button>
          )}
        </div>
      </header>

      {!readOnly && suggestions.length > 0 && (
        <div data-tour="speaker-banner" className="flex flex-wrap items-center gap-3 border-b border-brand-100 bg-brand-50 px-6 py-2.5 text-sm">
          <span className="text-brand-900">
            AI nhận ra tên người nói từ nội dung cuộc họp:{" "}
            {suggestions.map((s, i) => (
              <span key={s.id}>
                {i > 0 && ", "}
                {s.label} → <b className="font-medium">{s.suggested}</b>
              </span>
            ))}
          </span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => change((m) => ({ ...m, speakers: m.speakers.map((s) => ({ ...s, suggested: undefined })) }))}>
              Bỏ qua
            </Button>
            <Button size="sm" onClick={applySuggestions}>
              Áp dụng tên
            </Button>
          </div>
        </div>
      )}
      {!readOnly && flagged > 0 && (
        <div className={cn("flex items-center gap-3 border-b px-6 py-2 text-sm", pending ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800")}>
          {pending ? (
            <>
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Còn <b>{pending}</b>/{flagged} chỗ AI chưa chắc. Nghe câu gốc rồi bấm <b>Đúng, xác nhận</b> hoặc sửa trực tiếp.
            </>
          ) : (
            <>
              <Check className="h-4 w-4 shrink-0" />
              Đã xác nhận hết. Bấm <b>Duyệt biên bản</b> để khóa nội dung và xuất file.
            </>
          )}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div data-tour="transcript" className="min-h-0 border-r border-gray-200 bg-gray-50/60">
          <TranscriptPanel meeting={meeting} player={player} audioRef={audioRef} highlight={highlight} readOnly={readOnly} onRename={rename} />
        </div>
        <div className="min-h-0 overflow-y-auto bg-gray-50 px-6">
          <MinutesPanel
            meeting={meeting}
            readOnly={readOnly}
            onChange={change}
            onCite={cite}
            onConfirmed={() => setTimeout(goNextPending, 60)}
          />
        </div>
      </div>

      <Modal open={showAudit} onClose={() => setShowAudit(false)} title="Nhật ký xử lý & bảo mật" wide>
        <AuditLog meeting={meeting} />
      </Modal>

      <Modal
        open={justApproved}
        onClose={() => setJustApproved(false)}
        title="Biên bản đã được duyệt"
        footer={
          <>
            <Button variant="ghost" onClick={() => setJustApproved(false)}>Để sau</Button>
            <Button variant="secondary" onClick={() => doExport("pdf")}>PDF</Button>
            <Button onClick={() => doExport("docx")}>Tải Word</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Nội dung đã được khóa. Tải file để gửi cho người tham gia.</p>
      </Modal>

      <Modal
        open={!!exportFmt}
        onClose={() => setExportFmt(null)}
        title="Biên bản chưa được duyệt"
        footer={
          <>
            <Button variant="secondary" onClick={() => exportFmt && doExport(exportFmt)}>Vẫn xuất bản nháp</Button>
            <Button onClick={() => setExportFmt(null)}>Quay lại rà soát</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Biên bản đang là bản nháp
          {pending > 0 && <>, còn {pending} chỗ chưa xác nhận</>}. File xuất ra sẽ ghi rõ là bản nháp.
        </p>
      </Modal>
    </div>
  );
}

function FailedView({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  const del = useStore((s) => s.deleteMeeting);
  return (
    <div className="mx-auto max-w-xl p-8">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">← Danh sách cuộc họp</Link>
      <Card className="mt-4 p-8">
        <div className="flex items-center gap-2 text-red-700">
          <XCircle className="h-5 w-5" />
          <h1 className="text-2xl font-semibold">Không tạo được biên bản</h1>
        </div>
        <p className="mt-1 text-sm text-gray-600">{meeting.title}</p>
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-gray-800">{meeting.error}</p>
        <div className="mt-6 border-t border-gray-200 pt-4">
          <AuditLog meeting={meeting} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="danger"
            onClick={() => {
              del(meeting.id);
              dropAudio(meeting.id);
              router.push("/dashboard");
            }}
          >
            Xóa và tải lại file khác
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function MeetingPage() {
  const { id } = useParams<{ id: string }>();
  const meeting = useStore((s) => s.meetings.find((m) => m.id === id));

  if (!meeting) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-600">Không tìm thấy cuộc họp – có thể đã bị xóa.</p>
        <Link href="/dashboard" className="mt-3 inline-block text-sm text-brand-600 hover:underline">← Về danh sách cuộc họp</Link>
      </div>
    );
  }
  if (meeting.status === "processing") return <ProcessingView meeting={meeting} />;
  if (meeting.status === "failed") return <FailedView meeting={meeting} />;
  return <Editor meeting={meeting} />;
}
