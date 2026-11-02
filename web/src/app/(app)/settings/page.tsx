"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/components/Toaster";
import { Button, inputCls, LaterBadge, Modal, PageHeader, Section } from "@/components/ui";
import { AI_URL, backendUsable, useAiStatus } from "@/lib/ai";
import { RETENTION_DAYS, useStore } from "@/lib/store";
import { cn, fmtDateTime } from "@/lib/utils";

function Kv({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] border-b border-gray-200 py-2 text-sm">
      <span className="text-gray-500">{k}</span>
      <span>{children}</span>
    </div>
  );
}

function AiSection() {
  const { health, checkedAt, check } = useAiStatus();
  useEffect(() => {
    check();
  }, [check]);
  const usable = backendUsable(health);
  return (
    <Section
      label="AI service"
      aside="Mỗi bước chạy trong một hộp riêng (tiến trình và thư mục tạm riêng, chỉ có key của bước đó), hộp bị hủy ngay khi có kết quả."
    >
      <div className="border-t border-gray-200">
        <Kv k="Địa chỉ">
          <span className="font-mono text-xs">{AI_URL}</span>
        </Kv>
        <Kv k="Trạng thái">
          {!checkedAt ? (
            "đang kiểm tra…"
          ) : (
            <span className={cn("font-medium", usable ? "text-emerald-800" : health ? "text-amber-800" : "text-seal")}>
              {usable ? "Đang hoạt động" : health ? "Đang chạy nhưng thiếu API key" : "Không kết nối được – đang dùng chế độ giả lập"}
            </span>
          )}
        </Kv>
        {health && (
          <>
            <Kv k="Hộp 1 – chép lời">
              {health.stt} {!health.stt_ready && <span className="text-amber-800">(thiếu key)</span>}
            </Kv>
            <Kv k="Hộp 2 – tạo biên bản">
              {health.llm} {!health.llm_ready && <span className="text-amber-800">(thiếu key)</span>}
            </Kv>
          </>
        )}
      </div>
      <Button size="sm" variant="secondary" className="mt-3" onClick={() => check()}>
        Kiểm tra lại
      </Button>
    </Section>
  );
}

export default function SettingsPage() {
  const user = useStore((s) => s.user);
  const consentAt = useStore((s) => s.consentAt);
  const glossary = useStore((s) => s.glossary);
  const addGlossary = useStore((s) => s.addGlossary);
  const removeGlossary = useStore((s) => s.removeGlossary);
  const logs = useStore((s) => s.deletionLogs);
  const meetings = useStore((s) => s.meetings);
  const deleteAll = useStore((s) => s.deleteAllData);
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [typed, setTyped] = useState("");
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <PageHeader title="Cài đặt" />

      <Section label="Tài khoản">
        <div className="border-t border-gray-200">
          <Kv k="Họ tên">{user?.name}</Kv>
          <Kv k="Email Google">{user?.email}</Kv>
        </div>
      </Section>

      <AiSection />

      <Section
        label="Từ điển doanh nghiệp"
        aside={
          <>
            Từ viết tắt, tên dự án, tên nhân sự để AI viết đúng thuật ngữ nội bộ. <LaterBadge>Thử nghiệm</LaterBadge>
          </>
        }
      >
        <table className="w-full border-t border-gray-200 text-sm">
          <tbody>
            {glossary.map((g) => (
              <tr key={g.id} className="group border-b border-gray-200">
                <td className="w-36 py-2 font-mono">{g.term}</td>
                <td className="py-2 text-gray-700">{g.meaning}</td>
                <td className="w-8 text-right">
                  <button onClick={() => removeGlossary(g.id)} className="p-1 text-gray-400 opacity-0 hover:text-seal group-hover:opacity-100" title="Xóa">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!glossary.length && (
              <tr>
                <td className="py-3 text-gray-400">Chưa có thuật ngữ nào.</td>
              </tr>
            )}
          </tbody>
        </table>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!term.trim()) return;
            addGlossary(term.trim(), meaning.trim());
            setTerm("");
            setMeaning("");
          }}
        >
          <input className={inputCls + " max-w-[140px]"} placeholder="Viết tắt" value={term} onChange={(e) => setTerm(e.target.value)} />
          <input className={inputCls} placeholder="Nghĩa / cách viết đúng" value={meaning} onChange={(e) => setMeaning(e.target.value)} />
          <Button type="submit" variant="secondary">Thêm</Button>
        </form>
      </Section>

      <Section label="Quyền riêng tư & dữ liệu">
        <div className="border-t border-gray-200">
          <Kv k="File ghi âm">Xóa khỏi máy chủ ngay sau khi chép lời; bản nghe lại trên ứng dụng tối đa {RETENTION_DAYS} ngày</Kv>
          <Kv k="Huấn luyện AI">Không dùng dữ liệu cuộc họp để huấn luyện AI hay cho mục đích thương mại</Kv>
          <Kv k="Đồng ý xử lý">{consentAt ? fmtDateTime(consentAt) : "—"}</Kv>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-seal/40 p-4">
          <div className="text-sm">
            <div className="font-medium text-seal">Xóa toàn bộ dữ liệu</div>
            <div className="text-gray-600">Audio, transcript và biên bản của {meetings.length} cuộc họp. Không khôi phục được.</div>
          </div>
          <Button variant="danger" disabled={!meetings.length} onClick={() => setConfirm(true)}>
            Xóa tất cả
          </Button>
        </div>
        <h3 className="mt-6 text-sm font-semibold text-gray-900">Nhật ký xóa dữ liệu</h3>
        <div className="mt-2 text-sm">
          {logs.length ? (
            logs.map((l) => (
              <div key={l.id} className="grid grid-cols-[150px_1fr] border-b border-gray-200 py-1.5">
                <span className="font-mono text-xs text-gray-500">{fmtDateTime(l.at)}</span>
                <span className="text-gray-700">{l.what}</span>
              </div>
            ))
          ) : (
            <p className="text-gray-400">Chưa có thao tác xóa nào.</p>
          )}
        </div>
      </Section>

      <Section label="Hướng dẫn sử dụng">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-700">Xem lại hướng dẫn từng bước trên biên bản mẫu.</p>
          <Button variant="secondary" onClick={() => useStore.getState().setTourStep(0)}>
            Xem lại hướng dẫn
          </Button>
        </div>
      </Section>

      <Section label="Bản demo" aside="Dùng trước khi quay video demo.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-700">Xóa mọi dữ liệu demo trên trình duyệt này và quay về trang chủ.</p>
          <Button
            variant="secondary"
            onClick={() => {
              useStore.persist.clearStorage();
              useStore.setState(useStore.getInitialState(), true);
              router.push("/");
            }}
          >
            Đặt lại demo
          </Button>
        </div>
      </Section>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Xóa toàn bộ dữ liệu?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(false)}>Hủy</Button>
            <Button
              variant="danger"
              disabled={typed !== "XOA"}
              onClick={() => {
                deleteAll();
                setConfirm(false);
                setTyped("");
                toast.success("Đã xóa toàn bộ dữ liệu. Thao tác đã được ghi vào nhật ký.");
              }}
            >
              Xóa vĩnh viễn
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">Không thể hoàn tác. Gõ <b>XOA</b> để xác nhận.</p>
        <input className={inputCls + " mt-3"} value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="XOA" />
      </Modal>
    </div>
  );
}
