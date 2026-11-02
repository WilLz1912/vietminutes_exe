"use client";

import { CreditCard, FileText, HelpCircle, LayoutList, LogOut, Mic, Plus, Settings, Upload, Video } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ackJob, getJob } from "@/lib/ai";
import { useMounted } from "@/lib/hooks";
import { PLAN_LIMIT, PROCESSING_MS, usageThisMonth, useStore } from "@/lib/store";
import { ACCEPTED_EXT, cn } from "@/lib/utils";
import { useNewMeetingFlow } from "./NewMeeting";
import { Tour } from "./Tour";
import { toast } from "./Toaster";
import { Button, Logo } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Cuộc họp", icon: LayoutList },
  { href: "/templates", label: "Mẫu biên bản", icon: FileText },
  { href: "/extension", label: "Google Meet", icon: Video },
  { href: "/billing", label: "Gói dịch vụ", icon: CreditCard },
  { href: "/settings", label: "Cài đặt", icon: Settings },
];

// Tạo biên bản từ bất kỳ trang nào trong ứng dụng
function NewMeetingMenu() {
  const { startUpload, startRecord, dialogs } = useNewMeetingFlow();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative">
      {dialogs}
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
      <Button className="w-full" onClick={() => setOpen((v) => !v)}>
        <Plus className="h-4 w-4" /> Biên bản mới
      </Button>
      {open && (
        <div className="absolute left-0 right-0 top-10 z-20 overflow-hidden rounded-md border border-gray-200 bg-white p-1 text-sm shadow-lg" onMouseLeave={() => setOpen(false)}>
          <button
            className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              fileRef.current?.click();
            }}
          >
            <Upload className="h-4 w-4 text-gray-400" /> Tải file ghi âm
          </button>
          <button
            className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left hover:bg-gray-100"
            onClick={() => {
              setOpen(false);
              startRecord();
            }}
          >
            <Mic className="h-4 w-4 text-gray-400" /> Thu âm ngay
          </button>
        </div>
      )}
    </div>
  );
}

// Theo dõi các cuộc họp đang xử lý, kể cả khi người dùng đang ở trang khác:
// - engine "backend": hỏi AI service tiến trình, nhận kết quả rồi báo server xóa;
// - engine "mock": hoàn tất khi hết thời gian giả lập.
function ProcessingWatcher() {
  const processingCount = useStore((s) => s.meetings.filter((m) => m.status === "processing").length);
  useEffect(() => {
    if (!processingCount) return;
    let busy = false;
    const t = setInterval(async () => {
      if (busy) return;
      busy = true;
      const { meetings, finishProcessing, applyJob, failMeeting } = useStore.getState();
      const now = Date.now();
      for (const m of meetings.filter((x) => x.status === "processing")) {
        if (m.engine !== "backend") {
          if (now - (m.processingStartedAt ?? 0) >= PROCESSING_MS) {
            finishProcessing(m.id);
            toast.success(`Biên bản "${m.title}" đã sẵn sàng để rà soát.`);
          }
          continue;
        }
        if (!m.jobId) continue;
        try {
          const job = await getJob(m.jobId);
          if (job === "gone") {
            failMeeting(m.id, "AI service không còn giữ job này (server khởi động lại hoặc kết quả đã hết hạn).");
            continue;
          }
          applyJob(m.id, job);
          if (job.status === "done") {
            await ackJob(m.jobId);
            toast.success(`Biên bản "${m.title}" đã sẵn sàng để rà soát.`);
          } else if (job.status === "failed") {
            toast.error(`Xử lý "${m.title}" thất bại: ${job.error}`);
          }
        } catch {
          // AI service tạm thời không phản hồi: thử lại ở lượt sau
        }
      }
      busy = false;
    }, 1000);
    return () => clearInterval(t);
  }, [processingCount]);
  return null;
}

export function AppShell({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  const router = useRouter();
  const pathname = usePathname();
  const user = useStore((s) => s.user);
  const onboarded = useStore((s) => s.onboarded);
  const plan = useStore((s) => s.plan);
  const meetings = useStore((s) => s.meetings);
  const logout = useStore((s) => s.logout);
  const setTourStep = useStore((s) => s.setTourStep);

  useEffect(() => {
    if (!mounted) return;
    if (!user) router.replace("/login");
    else if (!onboarded) router.replace("/onboarding");
  }, [mounted, user, onboarded, router]);

  if (!mounted || !user || !onboarded) {
    return <div className="flex flex-1 items-center justify-center text-sm text-gray-500">Đang tải…</div>;
  }

  const used = usageThisMonth(meetings);
  const limit = PLAN_LIMIT[plan];

  const drafts = meetings.filter((m) => m.status === "draft").length;
  const processing = meetings.filter((m) => m.status === "processing").length;

  return (
    <div className="flex min-h-screen">
      <ProcessingWatcher />
      <Tour />
      <aside className="no-print sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
        <Link href="/dashboard" className="px-4 pb-5 pt-4">
          <Logo />
        </Link>
        <div className="px-3" data-tour="new-meeting">
          <NewMeetingMenu />
        </div>
        <nav className="mt-4 flex-1 space-y-0.5 px-3">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href === "/dashboard" && pathname.startsWith("/meetings"));
            return (
              <Link
                key={n.href}
                href={n.href}
                data-tour={n.href === "/extension" ? "nav-meet" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm",
                  active ? "bg-white font-medium text-gray-900 shadow-sm ring-1 ring-gray-200" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <n.icon className={cn("h-4 w-4", active ? "text-brand-600" : "text-gray-400")} />
                <span className="flex-1">{n.label}</span>
                {n.href === "/dashboard" && (processing > 0 || drafts > 0) && (
                  <span className="rounded-full bg-amber-100 px-1.5 text-[11px] font-medium text-amber-800">
                    {processing > 0 ? `${processing} đang chạy` : drafts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="mx-3 mb-3 rounded-lg border border-gray-200 bg-white p-3 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>{plan === "free" ? "Gói Free" : "Gói Premium"}</span>
            <span className={cn("font-medium", used >= limit && "text-red-600")}>
              {used}/{limit} tháng này
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className={cn("h-full rounded-full", used >= limit ? "bg-red-500" : "bg-brand-500")} style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} />
          </div>
          {plan === "free" && (
            <Link href="/billing" className="mt-2 inline-block font-medium text-brand-600 hover:underline">
              Nâng cấp Premium
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2.5 border-t border-gray-200 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-xs text-gray-500">{user.email}</div>
          </div>
          <button onClick={() => setTourStep(0)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Hướng dẫn sử dụng">
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="p-1 text-gray-500 hover:text-gray-900"
            title="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
