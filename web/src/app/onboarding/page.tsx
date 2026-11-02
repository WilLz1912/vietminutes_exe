"use client";

import { Check, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Logo } from "@/components/ui";
import { useMounted } from "@/lib/hooks";
import { useStore } from "@/lib/store";

const CONSENTS = [
  "Đồng ý để VietMinutes xử lý file ghi âm nhằm tạo bản chép lời và biên bản.",
  "Hiểu rằng file ghi âm bị xóa khỏi máy chủ sau khi chép lời, và có thể xóa dữ liệu bất kỳ lúc nào.",
  "Sẽ thông báo cho người tham gia trước khi ghi âm cuộc họp.",
];

// Chỉ hỏi quyền cơ bản rồi vào thẳng hướng dẫn sử dụng; mẫu biên bản và Extension để sau.
export default function OnboardingPage() {
  const mounted = useMounted();
  const router = useRouter();
  const user = useStore((s) => s.user);
  const complete = useStore((s) => s.completeOnboarding);
  const setTourStep = useStore((s) => s.setTourStep);
  const [agreed, setAgreed] = useState<boolean[]>(CONSENTS.map(() => false));
  const [mic, setMic] = useState<"idle" | "granted" | "denied">("idle");

  useEffect(() => {
    if (mounted && !user) router.replace("/login");
  }, [mounted, user, router]);

  if (!mounted || !user) return null;
  const ok = agreed.every(Boolean);

  const askMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMic("granted");
    } catch {
      setMic("denied");
    }
  };

  const start = () => {
    complete("project", false);
    setTourStep(0);
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-1 items-start justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-lg">
        <Logo />
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Chào {user.name.split(" ").pop()}, cấp quyền để bắt đầu</h1>
          <p className="mt-1 text-sm text-gray-500">Chỉ một bước. Sau đó bạn sẽ được xem hướng dẫn sử dụng ngắn.</p>

          <div className="mt-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Xử lý dữ liệu cuộc họp</h2>
            <button onClick={() => setAgreed(CONSENTS.map(() => true))} className="text-sm font-medium text-brand-600 hover:underline">
              Đồng ý tất cả
            </button>
          </div>
          <div className="mt-2 space-y-1">
            {CONSENTS.map((c, i) => (
              <label key={c} className="flex cursor-pointer gap-3 rounded-md px-2 py-2 text-sm hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-brand-600"
                  checked={agreed[i]}
                  onChange={(e) => setAgreed(agreed.map((v, j) => (j === i ? e.target.checked : v)))}
                />
                {c}
              </label>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-3">
            <Mic className="h-5 w-5 text-gray-400" />
            <div className="flex-1 text-sm">
              <div className="font-medium">Micro (không bắt buộc)</div>
              <div className="text-gray-500">Để thu âm cuộc họp ngay trên trình duyệt.</div>
            </div>
            {mic === "granted" ? (
              <span className="flex items-center gap-1 text-sm font-medium text-emerald-700">
                <Check className="h-4 w-4" /> Đã cho phép
              </span>
            ) : (
              <Button size="sm" variant="secondary" onClick={askMic}>
                {mic === "denied" ? "Thử lại" : "Cho phép"}
              </Button>
            )}
          </div>
          {mic === "denied" && <p className="mt-1 text-xs text-gray-500">Trình duyệt đã chặn micro – bạn vẫn dùng được bằng cách tải file lên.</p>}

          <Button size="lg" className="mt-6 w-full" disabled={!ok} onClick={start}>
            Tiếp tục
          </Button>
          {!ok && <p className="mt-2 text-center text-xs text-gray-500">Cần đồng ý cả 3 mục xử lý dữ liệu.</p>}
        </div>
      </div>
    </div>
  );
}
