"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LinkButton, Logo } from "@/components/ui";
import { useMounted } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { cn, vnd } from "@/lib/utils";

const STEPS = [
  ["Tải lên hoặc thu âm", "Kéo-thả file ghi âm, thu âm ngay trên web, hoặc bấm Record trong Google Meet."],
  ["Xác nhận chỗ AI chưa chắc", "Mỗi kết luận và đầu việc dẫn về câu gốc. Bạn chỉ cần nghe lại vài chỗ được đánh dấu."],
  ["Duyệt và gửi", "Tải biên bản Word hoặc PDF đúng mẫu, gửi cho người tham gia."],
];

const COMPARE: [string, string, string][] = [
  ["Kết quả", "Transcript hoặc tóm tắt chung", "Biên bản đủ mục: nội dung, kết luận, phân công, thời hạn"],
  ["Tiếng Việt", "Thường tối ưu cho tiếng Anh", "Giọng ba miền, viết tắt, thuật ngữ tiếng Anh chêm vào"],
  ["Kiểm chứng", "Phải nghe lại cả file", "Bấm vào từng mục để nghe đúng câu gốc"],
  ["Trước khi gửi", "AI gửi luôn bản tự sinh", "Bạn xác nhận chỗ chưa chắc rồi mới duyệt"],
  ["File ghi âm", "Lưu trên server không rõ thời hạn", "Xóa khỏi máy chủ ngay sau khi chép lời"],
];

const PIPELINE = [
  ["Hộp 1", "Chỉ nhận audio, chỉ trả ra chữ. Hủy ngay khi xong."],
  ["Hộp 2", "Chỉ nhận transcript, không có audio. Hủy ngay khi xong."],
  ["Kiểm tra", "Code đối chiếu từng mục với câu gốc, mục lệch được đánh dấu."],
  ["Bạn duyệt", "Không có gì được gửi đi trước khi bạn xác nhận."],
];

const FAQ = [
  ["Cần cài phần mềm gì không?", "Không. Dùng trên trình duyệt. Muốn ghi âm Google Meet thì cài thêm Chrome Extension, không cần mời bot vào phòng họp."],
  ["AI có tự gửi biên bản đi không?", "Không. Biên bản là bản nháp cho tới khi bạn xác nhận các chỗ được đánh dấu và bấm Duyệt."],
  ["Dữ liệu cuộc họp có bị dùng để huấn luyện AI?", "Không. Chỉ dùng dịch vụ API cam kết không lấy dữ liệu để huấn luyện. Bạn xóa dữ liệu bất kỳ lúc nào."],
  ["Gói Free có giới hạn gì?", "3 biên bản mỗi tháng, đủ tính năng chép lời, dẫn chiếu câu gốc và xuất file."],
];

// Ảnh chụp thu nhỏ màn hình rà soát biên bản – minh họa đúng sản phẩm
function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl shadow-gray-900/10">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
        <span className="text-sm font-semibold">Sprint Planning #14</span>
        <span className="rounded-md bg-brand-600 px-2.5 py-1 text-xs font-medium text-white">Xem mục cần xác nhận (1)</span>
      </div>
      <div className="space-y-3 bg-gray-50 p-5 text-[13px] leading-relaxed">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-[11px] font-medium text-gray-500">BIÊN BẢN HỌP · HỌP SPRINT</div>
          <div className="mt-2 font-semibold">2. Nội dung thảo luận</div>
          <p className="mt-1 text-gray-700">
            Nam (Backend) báo cáo API tracking đã hoàn thành khoảng 70%, phần còn lại là WebSocket đẩy vị trí shipper, cần thêm khoảng 3
            ngày.
          </p>
          <div className="mt-3 font-semibold">4. Phân công công việc</div>
          <div className="mt-1 grid grid-cols-[1fr_70px_110px] gap-2 border-b border-gray-100 py-1 text-gray-700">
            <span>Hoàn thiện API tracking</span>
            <span>Nam</span>
            <span>Thứ Năm, 30/10</span>
          </div>
          <div className="-mx-2 mt-1 rounded-md bg-amber-50 px-2 py-1.5 ring-1 ring-amber-200">
            <div className="grid grid-cols-[1fr_70px_110px] gap-2 text-gray-700">
              <span>Sửa lỗi VNPay trừ tiền 2 lần</span>
              <span>Nam</span>
              <span>Hôm nay hoặc mai</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[12px] text-amber-900">
              <span>Cần xác nhận: người nói chưa chốt ngày.</span>
              <span className="rounded bg-amber-400 px-1.5 py-0.5 font-medium text-amber-950">Đúng, xác nhận</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const mounted = useMounted();
  const user = useStore((s) => s.user);
  const [yearly, setYearly] = useState(true);
  const loggedIn = mounted && !!user;
  const startHref = loggedIn ? "/dashboard" : "/login";

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Logo />
          <nav className="hidden gap-7 text-sm text-gray-600 md:flex">
            <a href="#cach-lam" className="hover:text-gray-900">Cách hoạt động</a>
            <a href="#so-sanh" className="hover:text-gray-900">So sánh</a>
            <a href="#bao-mat" className="hover:text-gray-900">Bảo mật</a>
            <a href="#bang-gia" className="hover:text-gray-900">Bảng giá</a>
          </nav>
          <div className="flex items-center gap-2">
            {!loggedIn && <LinkButton href="/login" variant="ghost">Đăng nhập</LinkButton>}
            <LinkButton href={startHref}>{loggedIn ? "Mở ứng dụng" : "Dùng miễn phí"}</LinkButton>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-16 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Họp xong là có biên bản.
            <br />
            <span className="text-brand-600">Bạn chỉ cần duyệt.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-600">
            VietMinutes chép lời cuộc họp tiếng Việt và viết biên bản: nội dung thảo luận, kết luận, ai làm gì, khi nào. Chỗ nào AI chưa chắc
            sẽ được đánh dấu để bạn kiểm tra.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton href={startHref} size="lg">Tạo biên bản đầu tiên</LinkButton>
            <LinkButton href="/extension" variant="secondary" size="lg">Dùng trong Google Meet</LinkButton>
          </div>
          <p className="mt-4 text-sm text-gray-500">Miễn phí 3 biên bản mỗi tháng · không cần thẻ thanh toán</p>
        </div>
        <ProductPreview />
      </section>

      <section id="cach-lam" className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-semibold tracking-tight">Ba bước cho một cuộc họp</h2>
          <p className="mt-2 text-gray-600">Cuộc họp 60 phút có biên bản trong khoảng 5 phút, rà soát dưới 5 phút.</p>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map(([title, text], i) => (
              <li key={title} className="rounded-lg border border-gray-200 bg-white p-6">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{i + 1}</span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-gray-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="so-sanh" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">Không chỉ là bản chép lời</h2>
        <div className="mt-8 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[640px] text-left text-[15px]">
            <thead className="bg-gray-50 text-sm">
              <tr>
                <th className="w-36 px-5 py-3 font-medium text-gray-500" />
                <th className="px-5 py-3 font-medium text-gray-500">Công cụ ghi chú AI thông thường</th>
                <th className="px-5 py-3 font-semibold text-brand-700">VietMinutes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {COMPARE.map(([k, a, b]) => (
                <tr key={k}>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-500">{k}</td>
                  <td className="px-5 py-3.5 text-gray-500">{a}</td>
                  <td className="px-5 py-3.5">
                    <span className="flex gap-2">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                      {b}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="bao-mat" className="bg-gray-900 text-gray-300">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-white">Mỗi cuộc họp được xử lý trong hộp riêng, rồi hộp bị hủy</h2>
            <p className="mt-4 leading-relaxed">
              Bước chép lời và bước tạo biên bản chạy tách biệt, mỗi bước chỉ giữ đúng phần dữ liệu nó cần. Nhật ký xử lý cho bạn thấy hộp nào
              được tạo, hủy lúc nào, file ghi âm bị xóa lúc nào.
            </p>
            <p className="mt-4 text-sm text-gray-400">
              Tuân thủ Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 và Nghị định 356/2025/NĐ-CP. Không dùng dữ liệu họp để huấn luyện AI.
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {PIPELINE.map(([k, v], i) => (
              <li key={k} className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
                <div className="text-sm font-semibold text-white">
                  {i + 1}. {k}
                </div>
                <div className="mt-1 text-sm">{v}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="bang-gia" className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight">Bảng giá</h2>
          <div className="flex rounded-lg bg-gray-100 p-1 text-sm">
            {[
              [false, "Theo tháng"],
              [true, "Theo năm"],
            ].map(([v, label]) => (
              <button
                key={String(v)}
                onClick={() => setYearly(v as boolean)}
                className={cn("rounded-md px-4 py-1.5", yearly === v ? "bg-white font-medium shadow-sm" : "text-gray-600")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-7">
            <div className="font-semibold">Free</div>
            <div className="mt-2 text-4xl font-semibold tracking-tight">0đ</div>
            <ul className="mt-6 space-y-2.5 text-[15px] text-gray-700">
              {["3 biên bản mỗi tháng", "Chép lời và tách người nói", "Dẫn chiếu câu gốc, xác nhận chỗ chưa chắc", "Xuất Word, PDF"].map((x) => (
                <li key={x} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-gray-400" />{x}</li>
              ))}
            </ul>
            <LinkButton href={startHref} variant="secondary" className="mt-8 w-full">Bắt đầu miễn phí</LinkButton>
          </div>
          <div className="rounded-xl border-2 border-brand-600 p-7">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Premium</span>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {yearly ? "Giảm 10% năm đầu" : "Tháng đầu miễn phí"}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight">{yearly ? vnd(1_049_000) : vnd(109_000)}</span>
              <span className="text-sm text-gray-500">/{yearly ? "năm" : "tháng"} · doanh nghiệp</span>
            </div>
            {yearly && <div className="mt-1 text-sm text-gray-500">Giá gốc <s>{vnd(1_159_000)}</s></div>}
            <ul className="mt-6 space-y-2.5 text-[15px] text-gray-700">
              {["15 biên bản mỗi tháng, vượt hạn mức tính thêm", "Chrome Extension cho Google Meet", "Hỗ trợ đưa mẫu Word của công ty lên", "Hỗ trợ qua Zalo trong giờ hành chính"].map((x) => (
                <li key={x} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-brand-600" />{x}</li>
              ))}
            </ul>
            <LinkButton href={loggedIn ? "/billing" : "/login"} className="mt-8 w-full">Nâng cấp Premium</LinkButton>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-3xl font-semibold tracking-tight">Câu hỏi thường gặp</h2>
          <div className="mt-8 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                  {q}
                  <span className="text-gray-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-gray-600">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-sm text-gray-500">
          <Logo className="text-base" />
          <span>© 2026 VietMinutes · EXE101 Group 1 · bản demo</span>
          <Link href="/login" className="hover:text-gray-900">Đăng nhập</Link>
        </div>
      </footer>
    </div>
  );
}
