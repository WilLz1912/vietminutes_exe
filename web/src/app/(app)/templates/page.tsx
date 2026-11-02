"use client";

import { toast } from "@/components/Toaster";
import { Button, LaterBadge, PageHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { TEMPLATES } from "@/lib/templates";
import { cn } from "@/lib/utils";

export default function TemplatesPage() {
  const def = useStore((s) => s.defaultTemplateId);
  const setDef = useStore((s) => s.setDefaultTemplate);

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <PageHeader title="Mẫu biên bản" meta="Mẫu quyết định các mục của biên bản khi AI điền nội dung và khi xuất file." />

      <table className="mt-6 w-full text-sm">
        <thead className="text-left text-xs text-gray-500">
          <tr className="border-b border-gray-200">
            <th className="w-10 py-2" />
            <th className="py-2 font-normal">Mẫu</th>
            <th className="py-2 font-normal">Các phần của biên bản (mục 2–5)</th>
          </tr>
        </thead>
        <tbody>
          {TEMPLATES.map((t) => (
            <tr
              key={t.id}
              onClick={() => {
                if (def === t.id) return;
                setDef(t.id);
                toast.success(`Mẫu mặc định: ${t.name}.`);
              }}
              className={cn("cursor-pointer border-b border-gray-200 align-top hover:bg-white", def === t.id && "bg-white")}
            >
              <td className="py-4">
                <input type="radio" readOnly checked={def === t.id} className="accent-brand-600" />
              </td>
              <td className="py-4 pr-6">
                <div className="font-medium">
                  {t.name}
                  {def === t.id && <span className="ml-2 text-xs font-normal text-gray-500">mặc định</span>}
                </div>
                <div className="mt-0.5 text-gray-500">{t.description}</div>
              </td>
              <td className="py-4 text-gray-700">
                <ol className="list-decimal space-y-0.5 pl-5 marker:text-gray-400" start={2}>
                  <li>{t.sections.summary}</li>
                  <li>{t.sections.decisions}</li>
                  <li>{t.sections.actions}</li>
                  <li>{t.sections.openIssues}</li>
                </ol>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-10 grid gap-4 border border-dashed border-gray-400 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex items-center gap-2 font-medium">
            Dùng mẫu Word của công ty <LaterBadge />
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Trong giai đoạn Pilot, đội VietMinutes chuyển mẫu .docx hiện tại của bạn (thêm các biến như {"{{quyet_dinh}}"}, {"{{viec_can_lam}}"}).
          </p>
        </div>
        <Button variant="secondary" onClick={() => toast.info("Đã gửi yêu cầu. Đội hỗ trợ sẽ liên hệ qua Zalo.")}>
          Gửi yêu cầu hỗ trợ
        </Button>
      </div>
    </div>
  );
}
