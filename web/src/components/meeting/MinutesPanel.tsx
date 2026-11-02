"use client";

import { Flag, Headphones, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "@/components/Toaster";
import { Button, Modal } from "@/components/ui";
import { getTemplate } from "@/lib/templates";
import type { ActionItem, Meeting, MeetingInfo, Minutes, MinutesItem } from "@/lib/types";
import { docClosing } from "@/lib/minutesDoc";
import { cn, endTime, fmtDate, fmtDuration, fmtTime, uid } from "@/lib/utils";

type AnyKey = keyof Minutes;

// ô sửa trực tiếp, trông như chữ thường cho tới khi bấm vào
const editable =
  "w-full resize-none rounded-sm bg-transparent outline-none [field-sizing:content] hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-100 disabled:hover:bg-transparent";

function SourceLinks({ meeting, ids, onCite }: { meeting: Meeting; ids: string[]; onCite: (ids: string[]) => void }) {
  return (
    <>
      {ids.map((id) => {
        const seg = meeting.segments.find((g) => g.id === id);
        if (!seg) return null;
        return (
          <button
            key={id}
            onClick={() => onCite([id])}
            title={`Câu gốc: ${seg.text}`}
            className="rounded px-1 font-mono text-[11px] text-brand-600 hover:bg-brand-50"
          >
            {fmtTime(seg.start)}
          </button>
        );
      })}
    </>
  );
}

// Một mục trong biên bản. Mục AI chưa chắc: nền vàng + lý do + 2 nút rõ ràng.
function Item({
  item,
  meeting,
  readOnly,
  children,
  onConfirm,
  onDelete,
  onReport,
  onCite,
}: {
  item: MinutesItem;
  meeting: Meeting;
  readOnly: boolean;
  children: ReactNode;
  onConfirm: () => void;
  onDelete: () => void;
  onReport: () => void;
  onCite: (ids: string[]) => void;
}) {
  const pending = !item.confirmed;
  return (
    <div id={`item-${item.id}`} data-tour={pending ? "pending-item" : undefined} className={cn("group relative rounded-md", pending ? "-mx-3 my-2 bg-amber-50 px-3 py-2 ring-1 ring-amber-200" : "py-0.5")}>
      {children}
      {pending && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="flex-1 text-amber-900">
            <b className="font-medium">Cần xác nhận:</b> {item.note}
          </span>
          {item.sources.length > 0 && (
            <Button size="sm" variant="secondary" onClick={() => onCite(item.sources)}>
              <Headphones className="h-3.5 w-3.5" /> Nghe câu gốc
            </Button>
          )}
          {!readOnly && (
            <Button size="sm" variant="warning" onClick={onConfirm}>
              Đúng, xác nhận
            </Button>
          )}
        </div>
      )}
      <div className="absolute -top-3.5 right-0 z-10 hidden items-center gap-0.5 rounded-md border border-gray-200 bg-white px-1 shadow-sm group-hover:flex">
        {!pending && <SourceLinks meeting={meeting} ids={item.sources.slice(0, 1)} onCite={onCite} />}
        {!readOnly && (
          <>
            <button onClick={onReport} title="Báo lỗi AI" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
              <Flag className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} title="Xóa mục này" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function H2({ n, title, onAdd, readOnly }: { n: number; title: string; onAdd?: () => void; readOnly: boolean }) {
  return (
    <div className="group/h mb-2 mt-8 flex items-baseline justify-between">
      <h2 className="text-[16px] font-semibold text-gray-900">
        {n}. {title}
      </h2>
      {onAdd && !readOnly && (
        <button onClick={onAdd} className="flex items-center gap-1 text-xs text-gray-400 opacity-0 hover:text-brand-600 group-hover/h:opacity-100">
          <Plus className="h-3 w-3" /> Thêm
        </button>
      )}
    </div>
  );
}

const REPORT_TYPES = ["Sai tên người", "Sai nội dung / quyết định", "Sai thời hạn", "Thiếu thông tin", "Khác"];

export function MinutesPanel({
  meeting,
  readOnly,
  onChange,
  onCite,
  onConfirmed,
}: {
  meeting: Meeting;
  readOnly: boolean;
  onChange: (fn: (m: Meeting) => Meeting) => void;
  onCite: (ids: string[]) => void;
  onConfirmed: (itemId: string) => void;
}) {
  const t = getTemplate(meeting.templateId);
  const [report, setReport] = useState<MinutesItem | null>(null);
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const info = meeting.info;
  const attendees = meeting.speakers.map((s) => s.name || s.label).join(", ");

  const setInfo = (k: keyof MeetingInfo, v: string) => onChange((m) => ({ ...m, info: { ...m.info, [k]: v } }));
  const patchItem = (key: AnyKey, id: string, patch: Partial<ActionItem>) =>
    onChange((m) => ({
      ...m,
      minutes: { ...m.minutes, [key]: (m.minutes[key] as MinutesItem[]).map((i) => (i.id === id ? { ...i, ...patch } : i)) },
    }));
  const confirm = (key: AnyKey, id: string) => {
    patchItem(key, id, { confirmed: true });
    onConfirmed(id);
  };
  const removeItem = (key: AnyKey, id: string) =>
    onChange((m) => ({ ...m, minutes: { ...m.minutes, [key]: (m.minutes[key] as MinutesItem[]).filter((i) => i.id !== id) } }));
  const addItem = (key: AnyKey, topic?: string) => {
    const base: MinutesItem = { id: uid(), text: "", sources: [], confidence: "high", confirmed: true, ...(topic ? { topic } : {}) };
    const it = key === "actions" ? { ...base, owner: "", deadline: "" } : base;
    onChange((m) => ({ ...m, minutes: { ...m.minutes, [key]: [...(m.minutes[key] as MinutesItem[]), it] } }));
    setTimeout(() => document.querySelector<HTMLTextAreaElement>(`#item-${it.id} textarea`)?.focus(), 50);
  };

  const itemProps = (key: AnyKey, it: MinutesItem) => ({
    item: it,
    meeting,
    readOnly,
    onCite,
    onConfirm: () => confirm(key, it.id),
    onDelete: () => removeItem(key, it.id),
    onReport: () => setReport(it),
  });

  const textArea = (key: AnyKey, it: MinutesItem, placeholder: string) => (
    <textarea
      className={editable}
      value={it.text}
      disabled={readOnly}
      placeholder={placeholder}
      onChange={(e) => patchItem(key, it.id, { text: e.target.value })}
      onFocus={() => it.sources.length && onCite(it.sources)}
    />
  );

  // nhóm nội dung thảo luận theo chủ đề, giữ thứ tự xuất hiện
  const topics: { topic: string; items: MinutesItem[] }[] = [];
  for (const it of meeting.minutes.summary) {
    const key = it.topic ?? "";
    const g = topics.find((x) => x.topic === key);
    if (g) g.items.push(it);
    else topics.push({ topic: key, items: [it] });
  }

  const bullets = (key: "decisions" | "openIssues") =>
    meeting.minutes[key].length ? (
      <ul className="space-y-0.5">
        {meeting.minutes[key].map((it) => (
          <Item key={it.id} {...itemProps(key, it)}>
            <div className="flex gap-2">
              <span className="select-none pt-px text-gray-400">•</span>
              {textArea(key, it, "Nhập nội dung…")}
            </div>
          </Item>
        ))}
      </ul>
    ) : (
      <p className="text-gray-400">Không có.</p>
    );

  return (
    <article className="relative mx-auto my-8 max-w-[760px] rounded-lg border border-gray-200 bg-white px-12 py-10 text-[15px] leading-7 text-gray-800 shadow-sm">
      <div className="text-xs font-medium text-gray-500">Biên bản họp · {t.name}</div>
      <h1 className="mt-1 text-[22px] font-semibold leading-tight text-gray-900">{meeting.title}</h1>

      <dl className="mt-5 grid grid-cols-[130px_1fr] gap-x-4 gap-y-1 rounded-md bg-gray-50 px-4 py-3 text-[14px]">
        <dt className="text-gray-500">Thời gian</dt>
        <dd>
          {fmtDate(meeting.meetingDate)}
          {info.startTime && `, ${info.startTime} – ${endTime(info.startTime, meeting.duration)}`} ({fmtDuration(meeting.duration)})
        </dd>
        {(
          [
            ["location", "Địa điểm"],
            ["chair", "Chủ trì"],
            ["secretary", "Thư ký"],
          ] as [keyof MeetingInfo, string][]
        ).map(([k, label]) => (
          <div key={k} className="contents">
            <dt className="text-gray-500">{label}</dt>
            <dd>
              <input
                disabled={readOnly}
                value={info[k] ?? ""}
                placeholder="Chưa xác định – bấm để nhập"
                onChange={(e) => setInfo(k, e.target.value)}
                className="w-full rounded-sm bg-transparent outline-none placeholder:text-gray-400 hover:bg-white focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </dd>
          </div>
        ))}
        <dt className="text-gray-500">Thành phần</dt>
        <dd>{attendees || "—"}</dd>
      </dl>

      <H2 n={1} title="Mục đích cuộc họp" readOnly={readOnly} />
      <textarea
        className={editable}
        value={info.purpose ?? ""}
        disabled={readOnly}
        placeholder="Mục đích / chủ đề cuộc họp…"
        onChange={(e) => setInfo("purpose", e.target.value)}
      />

      <H2 n={2} title={t.sections.summary} onAdd={() => addItem("summary", topics.at(-1)?.topic)} readOnly={readOnly} />
      {topics.length === 0 && <p className="text-gray-400">Không có.</p>}
      {topics.map((g, i) => (
        <div key={g.topic || i} className="mb-3">
          {g.topic && (
            <h3 className="mb-1 font-medium text-gray-900">
              2.{i + 1}. {g.topic}
            </h3>
          )}
          {g.items.map((it) => (
            <Item key={it.id} {...itemProps("summary", it)}>
              {textArea("summary", it, "Nhập nội dung thảo luận…")}
            </Item>
          ))}
        </div>
      ))}

      <H2 n={3} title={t.sections.decisions} onAdd={() => addItem("decisions")} readOnly={readOnly} />
      {bullets("decisions")}

      <H2 n={4} title={t.sections.actions} onAdd={() => addItem("actions")} readOnly={readOnly} />
      {meeting.minutes.actions.length ? (
        <div className="overflow-hidden rounded-md border border-gray-200 text-[14px] leading-6">
          <div className="grid grid-cols-[36px_1fr_150px_140px] gap-3 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
            <span>STT</span>
            <span>Nội dung công việc</span>
            <span>Người phụ trách</span>
            <span>Thời hạn</span>
          </div>
          {meeting.minutes.actions.map((a, i) => (
            <div key={a.id} className="border-t border-gray-200 px-3 py-1">
              <Item {...itemProps("actions", a)}>
                <div className="grid grid-cols-[36px_1fr_150px_140px] gap-3">
                  <span className="pt-0.5 text-gray-500">{i + 1}</span>
                  {textArea("actions", a, "Mô tả công việc…")}
                  {(["owner", "deadline"] as const).map((k) => (
                    <textarea
                      key={k}
                      rows={1}
                      disabled={readOnly}
                      value={a[k]}
                      placeholder="Chưa xác định"
                      onChange={(e) => patchItem("actions", a.id, { [k]: e.target.value })}
                      className={cn(editable, (a[k] === "Chưa xác định" || !a[k]) && "text-gray-400")}
                    />
                  ))}
                </div>
              </Item>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">Không có.</p>
      )}

      <H2 n={5} title={t.sections.openIssues} onAdd={() => addItem("openIssues")} readOnly={readOnly} />
      {bullets("openIssues")}

      <p className="mt-8 text-gray-600">
        {docClosing(meeting)}
        {meeting.status === "approved" && meeting.approvedAt && ` Biên bản được duyệt ngày ${fmtDate(meeting.approvedAt)}.`}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-8 text-center text-[14px]">
        {[
          ["Thư ký", info.secretary],
          ["Chủ trì", info.chair],
        ].map(([role, name]) => (
          <div key={role}>
            <div className="font-semibold">{role}</div>
            <div className="h-10" />
            <div>{name || "…………………"}</div>
          </div>
        ))}
      </div>

      <Modal
        open={!!report}
        onClose={() => setReport(null)}
        title="Báo lỗi biên bản AI"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReport(null)}>Hủy</Button>
            <Button
              onClick={() => {
                toast.success("Đã ghi nhận lỗi để cải thiện độ chính xác cho doanh nghiệp của bạn.");
                setReport(null);
              }}
            >
              Gửi báo lỗi
            </Button>
          </>
        }
      >
        <p className="mb-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700">{report?.text}</p>
        <div className="space-y-2">
          {REPORT_TYPES.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm">
              <input type="radio" className="accent-brand-600" checked={reportType === r} onChange={() => setReportType(r)} />
              {r}
            </label>
          ))}
        </div>
      </Modal>
    </article>
  );
}
