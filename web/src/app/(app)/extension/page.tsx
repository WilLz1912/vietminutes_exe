"use client";

import { AlertTriangle, Check, Loader2, Mic, MicOff, MonitorSpeaker, Puzzle, Square, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UpgradeDialog, useQuota } from "@/components/NewMeeting";
import { Button, Card, Logo, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn, fmtTime } from "@/lib/utils";

type Step = "login" | "ready" | "recording" | "uploading" | "done";

const PEOPLE = ["Anh Minh", "Nam", "Linh", "Chị Hà"];

export default function ExtensionPage() {
  const installed = useStore((s) => s.extensionInstalled);
  const setInstalled = useStore((s) => s.setExtensionInstalled);
  const user = useStore((s) => s.user);
  const create = useStore((s) => s.createMeeting);
  const defaultTpl = useStore((s) => s.defaultTemplateId);
  const quota = useQuota();
  const [step, setStep] = useState<Step>("login");
  const [tab, setTab] = useState(true);
  const [mic, setMic] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);

  useEffect(() => {
    if (step !== "recording") return;
    const t0 = Date.now() - elapsed * 1000;
    const t = setInterval(() => setElapsed((Date.now() - t0) / 1000), 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const stop = () => {
    setStep("uploading");
    setTimeout(() => {
      // Bản demo không ghi âm thật trong mô phỏng; dùng thời lượng mẫu của kịch bản
      const id = create({
        title: `Google Meet – ${new Date().toLocaleDateString("vi-VN")}`,
        templateId: defaultTpl === "client" || defaultTpl === "weekly" ? defaultTpl : "sprint",
        source: "extension",
        fileName: "meet-abc-defg-hij.webm",
        fileSize: Math.round(elapsed * 16000) || 2_400_000,
        duration: 0,
        engine: "mock", // mô phỏng không có audio thật nên không gửi lên AI service
      });
      setMeetingId(id);
      setStep("done");
    }, 1500);
  };

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <PageHeader
        title="Ghi âm Google Meet"
        meta="Chrome Extension ghi âm thanh tab Meet và micro ngay trên trình duyệt, không cần mời bot vào phòng họp. Bên dưới là mô phỏng."
        actions={
          installed ? (
            <span className="flex items-center gap-1 text-sm text-gray-700"><Check className="h-4 w-4" /> Đã cài Extension</span>
          ) : (
            <Button onClick={() => setInstalled(true)}>Thêm vào Chrome</Button>
          )
        }
      />

      <div className="mt-8 overflow-hidden border border-gray-300 bg-white">
        {/* thanh trình duyệt giả lập */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-100 px-4 py-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-300" />
            <span className="h-3 w-3 rounded-full bg-amber-300" />
            <span className="h-3 w-3 rounded-full bg-emerald-300" />
          </div>
          <div className="flex-1 rounded-md bg-white px-3 py-1 text-xs text-gray-500">meet.google.com/abc-defg-hij</div>
          <div className={cn("relative rounded p-1", installed ? "bg-brand-100 text-brand-700" : "text-gray-300")} title="VietMinutes">
            <Puzzle className="h-4 w-4" />
            {step === "recording" && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />}
          </div>
        </div>

        <div className="relative grid min-h-[460px] grid-cols-2 gap-3 bg-gray-900 p-4 md:grid-cols-[1fr_1fr_340px]">
          {/* lưới video Meet */}
          <div className="col-span-2 grid grid-cols-2 grid-rows-[1fr_1fr_auto] gap-3">
            {PEOPLE.map((p, i) => (
              <div key={p} className="relative flex items-center justify-center rounded-lg bg-gray-700">
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white",
                    ["bg-sky-600", "bg-emerald-600", "bg-violet-600", "bg-orange-600"][i],
                    step === "recording" && i === Math.floor(elapsed / 3) % 4 && "ring-4 ring-sky-300",
                  )}
                >
                  {p.split(" ").pop()?.[0]}
                </span>
                <span className="absolute bottom-2 left-2 text-xs text-white">{p}</span>
              </div>
            ))}
            <div className="col-span-2 flex items-center justify-center gap-3 py-1">
              <span className="rounded-full bg-gray-700 p-2.5 text-white"><Mic className="h-4 w-4" /></span>
              <span className="rounded-full bg-gray-700 p-2.5 text-white"><Video className="h-4 w-4" /></span>
              <span className="rounded-full bg-red-600 px-5 py-2.5 text-xs text-white">Rời cuộc họp</span>
            </div>
          </div>

          {/* popup Extension */}
          <div className="col-span-2 md:col-span-1">
            {!installed ? (
              <Card className="p-5 text-center text-sm text-gray-600">
                <Puzzle className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2">Chưa cài Extension. Bấm “Thêm vào Chrome” ở trên để bắt đầu.</p>
              </Card>
            ) : (
              <Card className="w-full p-5 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <Logo className="text-sm" />
                  <span className="text-[10px] text-gray-400">v0.1 · MV3</span>
                </div>

                {step === "login" && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Đăng nhập để lưu bản ghi vào tài khoản VietMinutes.</p>
                    <Button className="mt-4 w-full" variant="secondary" onClick={() => setStep("ready")}>
                      Đăng nhập với Google
                    </Button>
                    <p className="mt-2 text-xs text-gray-400">Dùng chung phiên với Web App ({user?.email})</p>
                  </div>
                )}

                {(step === "ready" || step === "recording") && (
                  <div>
                    <div className="text-center font-mono text-3xl tabular-nums">{fmtTime(elapsed)}</div>
                    <div className="mt-1 text-center text-xs text-gray-500">{step === "recording" ? "● Đang ghi âm" : "Sẵn sàng ghi âm"}</div>
                    <div className="mt-4 space-y-2 text-sm">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="accent-brand-600" checked={tab} disabled={step === "recording"} onChange={(e) => setTab(e.target.checked)} />
                        <MonitorSpeaker className="h-4 w-4 text-gray-500" /> Âm thanh tab Google Meet
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="accent-brand-600" checked={mic} disabled={step === "recording"} onChange={(e) => setMic(e.target.checked)} />
                        {mic ? <Mic className="h-4 w-4 text-gray-500" /> : <MicOff className="h-4 w-4 text-gray-500" />} Micro của tôi
                      </label>
                    </div>
                    <div className="mt-3 flex gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Nhớ thông báo cho người tham gia rằng cuộc họp đang được ghi âm.
                    </div>
                    {step === "ready" ? (
                      <Button
                        className="mt-4 w-full"
                        disabled={!tab && !mic}
                        onClick={() => {
                          if (quota.exceeded) return setUpgrade(true);
                          setElapsed(0);
                          setStep("recording");
                        }}
                      >
                        ● Record
                      </Button>
                    ) : (
                      <Button className="mt-4 w-full" variant="danger" onClick={stop}>
                        <Square className="h-3.5 w-3.5 fill-white" /> Stop
                      </Button>
                    )}
                  </div>
                )}

                {step === "uploading" && (
                  <div className="py-6 text-center text-sm text-gray-600">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600" />
                    <p className="mt-2">Đang tải bản ghi lên tài khoản…</p>
                  </div>
                )}

                {step === "done" && meetingId && (
                  <div className="text-center">
                    <span className="mx-auto flex h-10 w-10 items-center justify-center border border-brand-600 text-brand-600">
                      <Check className="h-5 w-5" />
                    </span>
                    <p className="mt-2 text-sm">Đã tải lên. AI đang tạo biên bản.</p>
                    <Link
                      href={`/meetings/${meetingId}`}
                      className="mt-4 block bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                    >
                      Mở biên bản trên Web
                    </Link>
                    <button
                      onClick={() => {
                        setElapsed(0);
                        setStep("ready");
                      }}
                      className="mt-2 text-xs text-gray-500 hover:underline"
                    >
                      Ghi cuộc họp khác
                    </button>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Đây là mô phỏng giao diện Extension (vòng 3 của MVP). Bản thật dùng chrome.tabCapture + offscreen document + MediaRecorder.
      </p>
      <UpgradeDialog open={upgrade} onClose={() => setUpgrade(false)} />
    </div>
  );
}
