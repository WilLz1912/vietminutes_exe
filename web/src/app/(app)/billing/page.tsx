"use client";

import { QrCode } from "lucide-react";
import { useState } from "react";
import { useQuota } from "@/components/NewMeeting";
import { toast } from "@/components/Toaster";
import { Button, Modal, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn, vnd } from "@/lib/utils";

const OPTIONS = {
  yearly: { label: "Gói năm", price: 1_590_000, list: 2_099_000, note: "Giảm 24% năm đầu (ưu đãi ra mắt), từ năm sau 2.099.000đ", per: "năm" },
  monthly: { label: "Gói tháng", price: 199_000, list: 199_000, note: "Miễn phí tháng đầu tiên", per: "tháng" },
} as const;

// Ô vuông giả lập mã QR thanh toán (không phải mã thật)
function FakeQr() {
  const cells = Array.from({ length: 21 * 21 }, (_, i) => {
    const x = i % 21;
    const y = Math.floor(i / 21);
    const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    if (finder) {
      const fx = x > 13 ? x - 14 : x;
      const fy = y > 13 ? y - 14 : y;
      return fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx > 1 && fx < 5 && fy > 1 && fy < 5);
    }
    return (x * 7 + y * 13 + x * y) % 3 === 0;
  });
  return (
    <div className="grid grid-cols-[repeat(21,8px)] gap-0 border border-gray-300 bg-white p-3">
      {cells.map((on, i) => (
        <div key={i} className={cn("h-2 w-2", on && "bg-gray-900")} />
      ))}
    </div>
  );
}

export default function BillingPage() {
  const plan = useStore((s) => s.plan);
  const setPlan = useStore((s) => s.setPlan);
  const { used, limit } = useQuota();
  const [opt, setOpt] = useState<keyof typeof OPTIONS>("yearly");
  const [checkout, setCheckout] = useState(false);
  const [paying, setPaying] = useState(false);
  const o = OPTIONS[opt];
  const dueNow = opt === "monthly" ? 0 : o.price;

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <PageHeader
        title="Gói dịch vụ"
        meta={`Đang dùng gói ${plan === "free" ? "Free" : "Premium"} · ${used}/${limit} biên bản trong tháng này`}
        actions={
          plan === "premium" && (
          <Button
            variant="ghost"
            onClick={() => {
              setPlan("free");
              toast.info("Đã chuyển về gói Free (demo).");
            }}
          >
            Hạ về gói Free
          </Button>
          )
        }
      />

      {plan === "premium" ? (
        <p className="mt-8 text-gray-700">Tài khoản đang ở gói Premium: 15 biên bản mỗi tháng, đủ mọi tính năng.</p>
      ) : (
        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Chọn chu kỳ thanh toán Premium</h2>
            <div className="mt-3 border-t border-gray-200">
              {(Object.keys(OPTIONS) as (keyof typeof OPTIONS)[]).map((k) => {
                const x = OPTIONS[k];
                return (
                  <label key={k} className={cn("flex cursor-pointer items-baseline gap-4 border-b border-gray-200 py-4", opt === k && "bg-white")}>
                    <input type="radio" name="opt" checked={opt === k} onChange={() => setOpt(k)} className="accent-brand-600" />
                    <span className="w-28 font-medium">{x.label}</span>
                    <span className="flex-1 text-sm text-gray-600">{x.note}</span>
                    <span className="text-xl font-semibold">{vnd(x.price)}</span>
                    <span className="w-16 text-sm text-gray-500">/ {x.per}</span>
                  </label>
                );
              })}
            </div>
            <h2 className="mt-8 text-sm font-semibold text-gray-900">Free và Premium khác nhau ở đâu</h2>
            <table className="mt-3 w-full border-t border-gray-200 text-sm">
              <tbody>
                {[
                  ["Biên bản mỗi tháng", "3", "15, mua thêm tối đa 25"],
                  ["Mua thêm biên bản", "—", "5 đầu 29.000đ, 5 tiếp 39.000đ"],
                  ["Chép lời, dẫn chiếu câu gốc, xuất file", "Có", "Có"],
                  ["Chrome Extension cho Google Meet", "—", "Có"],
                  ["Đưa mẫu Word của công ty lên", "—", "Đội hỗ trợ làm giúp"],
                  ["Hỗ trợ", "Tài liệu", "Zalo, giờ hành chính"],
                ].map(([k, a, b]) => (
                  <tr key={k} className="border-b border-gray-200">
                    <td className="py-2 text-gray-600">{k}</td>
                    <td className="w-24 py-2 text-gray-500">{a}</td>
                    <td className="w-44 py-2">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="h-fit border border-gray-300 bg-white p-5">
            <div className="text-sm text-gray-500">Thanh toán hôm nay</div>
            <div className="mt-1 text-3xl font-semibold">{vnd(dueNow)}</div>
            <div className="mt-1 text-sm text-gray-600">
              {opt === "monthly" ? `Tháng đầu miễn phí, sau đó ${vnd(o.price)}/tháng` : <>Giá gốc <s>{vnd(o.list)}</s></>}
            </div>
            <Button className="mt-5 w-full" onClick={() => setCheckout(true)}>
              Thanh toán bằng mã QR
            </Button>
          </aside>
        </div>
      )}

      <Modal
        open={checkout}
        onClose={() => setCheckout(false)}
        title="Thanh toán bằng mã QR"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCheckout(false)}>Hủy</Button>
            <Button
              disabled={paying}
              onClick={() => {
                setPaying(true);
                setTimeout(() => {
                  setPaying(false);
                  setCheckout(false);
                  setPlan("premium");
                  toast.success("Thanh toán thành công! Tài khoản đã lên gói Premium.");
                }, 1200);
              }}
            >
              {paying ? "Đang xác nhận…" : "Tôi đã thanh toán"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center">
          <FakeQr />
          <div className="mt-4 flex items-center gap-1 text-sm text-gray-500">
            <QrCode className="h-4 w-4" /> Quét bằng app ngân hàng – mã QR minh họa
          </div>
          <div className="mt-3 w-full border-t border-gray-200 pt-3 text-left text-sm">
            <div className="flex justify-between"><span>{o.label} Premium</span><span>{vnd(o.price)}</span></div>
            {opt === "monthly" && <div className="flex justify-between text-gray-600"><span>Tháng đầu miễn phí</span><span>-{vnd(o.price)}</span></div>}
            <div className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-semibold"><span>Thanh toán hôm nay</span><span>{vnd(dueNow)}</span></div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
