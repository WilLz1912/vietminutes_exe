"use client";

// Hướng dẫn sử dụng ngay sau khi đăng nhập: làm tối màn hình, khoanh sáng đúng chỗ cần bấm trên giao diện thật
// (dùng biên bản mẫu), kèm thẻ giải thích. Có thể bỏ qua bất kỳ lúc nào (nút Bỏ qua hoặc phím Esc).
import { ArrowRight, Check, FileAudio, ListChecks, Send, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

interface Step {
  route: "/dashboard" | "sample";
  target?: string; // giá trị data-tour của phần tử cần khoanh sáng; không có = thẻ ở giữa màn hình
  title: string;
  body: ReactNode;
}

function Flow() {
  const items = [
    { icon: FileAudio, label: "Tải file / thu âm" },
    { icon: ListChecks, label: "Xác nhận chỗ AI chưa chắc" },
    { icon: Send, label: "Duyệt & xuất Word" },
  ];
  return (
    <div className="my-4 flex items-center justify-between gap-1">
      {items.map((it, i) => (
        <div key={it.label} className="flex items-center gap-1">
          <div className="flex w-24 flex-col items-center gap-1.5 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <it.icon className="h-5 w-5" />
            </span>
            <span className="text-xs leading-tight text-gray-700">{it.label}</span>
          </div>
          {i < items.length - 1 && <ArrowRight className="mb-5 h-4 w-4 text-gray-300" />}
        </div>
      ))}
    </div>
  );
}

const STEPS: Step[] = [
  {
    route: "/dashboard",
    title: "Chào mừng đến với VietMinutes",
    body: (
      <>
        <p>Mỗi cuộc họp chỉ cần 3 bước:</p>
        <Flow />
        <p>Xem nhanh cách dùng trên một biên bản mẫu – khoảng 1 phút.</p>
      </>
    ),
  },
  {
    route: "/dashboard",
    target: "new-meeting",
    title: "Tạo biên bản mới",
    body: "Bấm vào đây để tải file ghi âm hoặc thu âm ngay. Bạn cũng có thể kéo-thả file vào trang Cuộc họp.",
  },
  {
    route: "/dashboard",
    target: "todo",
    title: "Việc cần làm tiếp",
    body: "Biên bản nào cần bạn xác nhận hoặc duyệt sẽ hiện ở đây. Cùng mở thử một biên bản mẫu.",
  },
  {
    route: "sample",
    target: "transcript",
    title: "Lời thoại cuộc họp",
    body: "Bên trái là toàn bộ lời thoại đã chép, chia theo người nói. Bấm vào câu nào để nghe lại đúng đoạn đó.",
  },
  {
    route: "sample",
    target: "speaker-banner",
    title: "Tên người nói",
    body: "AI đoán tên từ nội dung (ví dụ khi có người gọi tên). Thấy đúng thì bấm “Áp dụng tên”, toàn bộ biên bản sẽ cập nhật.",
  },
  {
    route: "sample",
    target: "pending-item",
    title: "Chỗ AI chưa chắc",
    body: "Nền vàng là chỗ cần bạn kiểm tra, kèm lý do. Bấm “Nghe câu gốc”, thấy đúng thì “Đúng, xác nhận”, sai thì sửa trực tiếp.",
  },
  {
    route: "sample",
    target: "steps",
    title: "Luôn biết bước tiếp theo",
    body: "Thanh bước cho biết bạn đang ở đâu: Rà soát → Duyệt → Xuất file. Nút xanh bên phải luôn là việc nên làm tiếp.",
  },
  {
    route: "sample",
    target: "nav-meet",
    title: "Họp trên Google Meet?",
    body: "Cài Chrome Extension để ghi âm ngay trong cuộc họp, không cần mời bot. Ghi xong biên bản tự được tạo.",
  },
  {
    route: "/dashboard",
    title: "Bạn đã sẵn sàng",
    body: "Tải file ghi âm cuộc họp đầu tiên của bạn. Có thể xem lại hướng dẫn này bất cứ lúc nào ở nút “Hướng dẫn” cuối thanh bên trái.",
  },
];

type Rect = { top: number; left: number; width: number; height: number };
const PAD = 6;
const CARD_W = 360;

function placeCard(r: Rect | null): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!r) return { top: vh / 2 - 160, left: vw / 2 - CARD_W / 2 };
  const clampX = (x: number) => Math.max(16, Math.min(vw - CARD_W - 16, x));
  const clampY = (y: number) => Math.max(16, Math.min(vh - 260, y));
  if (r.left + r.width + CARD_W + 32 < vw) return { top: clampY(r.top), left: r.left + r.width + 20 }; // bên phải
  if (r.top + r.height + 240 < vh) return { top: r.top + r.height + 16, left: clampX(r.left) }; // bên dưới
  if (r.left - CARD_W - 20 > 0) return { top: clampY(r.top), left: r.left - CARD_W - 20 }; // bên trái
  return { top: clampY(r.top - 230), left: clampX(r.left) }; // bên trên
}

export function Tour() {
  const router = useRouter();
  const pathname = usePathname();
  const step = useStore((s) => s.tourStep);
  const setStep = useStore((s) => s.setTourStep);
  const sampleId = useStore((s) => s.meetings.find((m) => m.sample && m.status === "draft")?.id);
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);

  const steps = STEPS.filter((s) => s.route !== "sample" || sampleId);
  const cur = step === null ? null : steps[step];
  const routePath = cur ? (cur.route === "sample" ? `/meetings/${sampleId}` : cur.route) : null;

  // chuyển trang nếu bước cần trang khác
  useEffect(() => {
    if (routePath && pathname !== routePath) router.push(routePath);
  }, [routePath, pathname, router]);

  // tìm phần tử cần khoanh sáng, đo lại liên tục vì bố cục có thể thay đổi
  useEffect(() => {
    if (!cur || pathname !== routePath) return;
    let scrolled = false;
    const started = Date.now();
    const tick = () => {
      if (!cur.target) {
        setRect(null);
        setReady(true);
        return;
      }
      const el = document.querySelector<HTMLElement>(`[data-tour="${cur.target}"]`);
      if (!el) {
        // không có phần tử (vd. đã áp dụng tên) → hiện thẻ ở giữa sau 1.2 giây
        if (Date.now() - started > 1200) {
          setRect(null);
          setReady(true);
        }
        return;
      }
      if (!scrolled) {
        el.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
        scrolled = true;
      }
      const b = el.getBoundingClientRect();
      setRect({ top: b.top - PAD, left: b.left - PAD, width: b.width + PAD * 2, height: b.height + PAD * 2 });
      setReady(true);
    };
    const id = setInterval(tick, 150);
    return () => {
      clearInterval(id);
      setReady(false);
    };
  }, [cur, pathname, routePath]);

  const close = () => setStep(null);

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" && step < steps.length - 1) setStep(step + 1);
      if (e.key === "ArrowLeft" && step > 0) setStep(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!cur || !ready || pathname !== routePath) return null;
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;
  const pos = placeCard(rect);

  return (
    <div className="no-print fixed inset-0 z-[90]">
      {/* lớp tối + lỗ sáng quanh phần tử */}
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-brand-400 transition-all duration-300"
          style={{ ...rect, boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.6)" }}
        >
          <span className="absolute inset-0 animate-ping rounded-lg ring-2 ring-brand-300 [animation-duration:1.6s]" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gray-900/60" />
      )}
      {/* chặn bấm vào trang phía sau trong lúc xem hướng dẫn */}
      <div className="absolute inset-0" />

      <div
        className="absolute rounded-xl bg-white p-5 shadow-2xl transition-all duration-300"
        style={{ top: pos.top, left: pos.left, width: CARD_W }}
        role="dialog"
        aria-label={cur.title}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold">{cur.title}</h3>
          <button onClick={close} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Bỏ qua hướng dẫn (Esc)">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 text-sm leading-relaxed text-gray-600">{cur.body}</div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-5 bg-brand-600" : "w-1.5 bg-gray-300")} />
            ))}
          </div>
          <div className="flex gap-2">
            {isFirst ? (
              <Button variant="ghost" size="sm" onClick={close}>
                Bỏ qua
              </Button>
            ) : (
              !isLast && (
                <Button variant="ghost" size="sm" onClick={() => setStep(step! - 1)}>
                  Quay lại
                </Button>
              )
            )}
            {isLast ? (
              <Button size="sm" onClick={close}>
                <Check className="h-3.5 w-3.5" /> Bắt đầu dùng
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep(step! + 1)}>
                {isFirst ? "Xem hướng dẫn" : "Tiếp"} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        {!isFirst && !isLast && (
          <button onClick={close} className="mt-3 text-xs text-gray-400 hover:text-gray-700">
            Bỏ qua hướng dẫn
          </button>
        )}
      </div>
    </div>
  );
}
