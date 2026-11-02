"use client";

import { ChevronRight, Mic, Search, Trash2, Upload, Video, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useNewMeetingFlow } from "@/components/NewMeeting";
import { toast } from "@/components/Toaster";
import { Button, Modal, PageHeader, StatusBadge } from "@/components/ui";
import { dropAudio } from "@/lib/audio";
import { pendingCount, useStore } from "@/lib/store";
import { getTemplate } from "@/lib/templates";
import type { Meeting, MeetingStatus } from "@/lib/types";
import { ACCEPTED_EXT, cn, fmtDate, fmtDuration, SOURCE_LABEL } from "@/lib/utils";

const FILTERS: { key: MeetingStatus | "all"; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "draft", label: "Bản nháp" },
  { key: "approved", label: "Đã duyệt" },
  { key: "processing", label: "Đang xử lý" },
];

export default function DashboardPage() {
  const router = useRouter();
  const meetings = useStore((s) => s.meetings);
  const extensionInstalled = useStore((s) => s.extensionInstalled);
  const deleteMeeting = useStore((s) => s.deleteMeeting);
  const { startUpload, startRecord, dialogs } = useNewMeetingFlow();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<MeetingStatus | "all">("all");
  const [drag, setDrag] = useState(false);
  const [hideExt, setHideExt] = useState(false);
  const [toDelete, setToDelete] = useState<Meeting | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(() => [...meetings].sort((a, b) => b.createdAt - a.createdAt), [meetings]);
  const list = sorted
    .filter((m) => filter === "all" || m.status === filter)
    .filter((m) => m.title.toLowerCase().includes(q.trim().toLowerCase()));
  const todo = sorted.filter((m) => m.status === "draft" || m.status === "failed");
  const count = (k: MeetingStatus | "all") => (k === "all" ? meetings.length : meetings.filter((m) => m.status === k).length);
  const pickFile = () => fileRef.current?.click();

  return (
    <div
      className="relative min-h-screen"
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={(e) => e.currentTarget === e.target && setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) startUpload(f);
      }}
    >
      {dialogs}
      {drag && (
        <div className="pointer-events-none fixed inset-0 z-40 m-3 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-500 bg-brand-50/90 text-brand-700">
          <Upload className="h-8 w-8" />
          <span className="text-lg font-medium">Thả file để tạo biên bản</span>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_EXT.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) startUpload(f);
          e.target.value = "";
        }}
      />

      <div className="mx-auto max-w-5xl px-8 py-8">
        <PageHeader
          title="Cuộc họp"
          meta="Tải file ghi âm hoặc kéo-thả vào trang này để tạo biên bản."
          actions={
            <>
              <Button variant="secondary" onClick={startRecord}>
                <Mic className="h-4 w-4" /> Thu âm
              </Button>
              <Button onClick={pickFile}>
                <Upload className="h-4 w-4" /> Tải file ghi âm
              </Button>
            </>
          }
        />

        {!extensionInstalled && !hideExt && (
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
            <Video className="h-4 w-4 text-gray-400" />
            <span className="flex-1">Họp trên Google Meet? Cài Chrome Extension để ghi âm ngay trong cuộc họp, không cần mời bot.</span>
            <Link href="/extension" className="font-medium text-brand-600 hover:underline">
              Cài đặt
            </Link>
            <button onClick={() => setHideExt(true)} className="rounded p-0.5 text-gray-400 hover:text-gray-700" title="Ẩn">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {todo.length > 0 && (
          <section data-tour="todo" className="mt-6 overflow-hidden rounded-lg border border-amber-200 bg-amber-50/50">
            <h2 className="border-b border-amber-200 px-4 py-2.5 text-sm font-semibold text-amber-900">
              Cần bạn xử lý · {todo.length}
            </h2>
            <ul className="divide-y divide-amber-100">
              {todo.map((m) => {
                const pending = m.status === "draft" ? pendingCount(m) : 0;
                return (
                  <li key={m.id}>
                    <Link href={`/meetings/${m.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-amber-50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-gray-900">{m.title}</span>
                        <span className="text-xs text-gray-500">{fmtDate(m.meetingDate)}</span>
                      </span>
                      <span className={cn("text-sm", m.status === "failed" ? "text-red-700" : "text-amber-800")}>
                        {m.status === "failed" ? "Xử lý lỗi" : pending ? `${pending} chỗ cần xác nhận` : "Sẵn sàng để duyệt"}
                      </span>
                      <span className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-800 shadow-sm">
                        {m.status === "failed" ? "Xem lỗi" : pending ? "Rà soát" : "Duyệt"}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5">
            <div className="flex gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-sm",
                    filter === f.key ? "bg-gray-100 font-medium text-gray-900" : "text-gray-500 hover:text-gray-900",
                  )}
                >
                  {f.label} <span className="text-gray-400">{count(f.key)}</span>
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên…"
                className="h-8 w-56 rounded-md border border-gray-300 pl-8 pr-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-sm text-gray-500">
              {meetings.length ? (
                "Không có cuộc họp nào khớp."
              ) : (
                <>
                  <span>Chưa có cuộc họp nào.</span>
                  <Button onClick={pickFile}>
                    <Upload className="h-4 w-4" /> Tải file ghi âm đầu tiên
                  </Button>
                </>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Tên cuộc họp</th>
                  <th className="px-4 py-2 font-medium">Ngày</th>
                  <th className="px-4 py-2 font-medium">Thời lượng</th>
                  <th className="px-4 py-2 font-medium">Mẫu</th>
                  <th className="px-4 py-2 font-medium">Trạng thái</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((m) => (
                  <tr key={m.id} onClick={() => router.push(`/meetings/${m.id}`)} className="group cursor-pointer hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{m.title}</div>
                      <div className="text-xs text-gray-500">
                        {SOURCE_LABEL[m.source]}
                        {m.sample && " · ví dụ mẫu"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(m.meetingDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDuration(m.duration)}</td>
                    <td className="px-4 py-3 text-gray-600">{getTemplate(m.templateId).name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-2 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setToDelete(m);
                        }}
                        className="rounded p-1.5 text-gray-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                        title="Xóa cuộc họp"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Xóa vĩnh viễn cuộc họp?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>Hủy</Button>
            <Button
              variant="danger"
              onClick={() => {
                if (!toDelete) return;
                deleteMeeting(toDelete.id);
                dropAudio(toDelete.id);
                toast.success("Đã xóa vĩnh viễn audio, transcript và biên bản.");
                setToDelete(null);
              }}
            >
              Xóa vĩnh viễn
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Audio, bản chép lời và biên bản của <b>{toDelete?.title}</b> sẽ bị xóa và không khôi phục được.
        </p>
      </Modal>
    </div>
  );
}
