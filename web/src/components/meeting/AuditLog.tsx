"use client";

import { ShieldCheck } from "lucide-react";
import type { Meeting } from "@/lib/types";

export function AuditLog({ meeting }: { meeting: Meeting }) {
  if (meeting.engine !== "backend") {
    return (
      <p className="text-sm text-gray-600">
        Cuộc họp này được xử lý ở <b>chế độ giả lập</b> ngay trên trình duyệt (chưa kết nối AI service), nên không có nhật ký xử lý.
      </p>
    );
  }
  const audit = meeting.audit ?? [];
  return (
    <div>
      <p className="mb-3 flex items-start gap-2 text-xs text-gray-600">
        <ShieldCheck className="h-4 w-4 shrink-0 text-gray-500" />
        Nhật ký chỉ ghi thao tác hệ thống, không chứa nội dung cuộc họp.
      </p>
      <ol className="border-t border-gray-200">
        {audit.map((a, i) => (
          <li key={i} className="grid grid-cols-[72px_1fr] gap-2 border-b border-gray-200 py-1.5 text-sm">
            <span className="pt-0.5 font-mono text-xs text-gray-400">
              {new Date(a.at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            {a.text}
          </li>
        ))}
        {!audit.length && <li className="py-2 text-sm text-gray-400">Đang chờ AI service…</li>}
      </ol>
    </div>
  );
}
