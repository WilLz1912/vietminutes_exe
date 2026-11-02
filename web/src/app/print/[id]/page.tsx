"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui";
import { useMounted } from "@/lib/hooks";
import { docClosing, docMeta, docSections, docTopics } from "@/lib/minutesDoc";
import { useStore } from "@/lib/store";
import type { MinutesItem } from "@/lib/types";

function Dashes({ items }: { items: MinutesItem[] }) {
  if (!items.length) return <p className="pl-6 italic">Không có.</p>;
  return (
    <div className="pl-6">
      {items.map((i) => (
        <p key={i.id}>- {i.text}</p>
      ))}
    </div>
  );
}

export default function PrintPage() {
  const mounted = useMounted();
  const { id } = useParams<{ id: string }>();
  const m = useStore((s) => s.meetings.find((x) => x.id === id));

  useEffect(() => {
    if (!mounted || !m) return;
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, [mounted, m]);

  if (!mounted) return null;
  if (!m) return <p className="p-10">Không tìm thấy biên bản.</p>;
  const sec = docSections(m);

  return (
    <div className="flex-1 bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end gap-2">
        <Button variant="secondary" onClick={() => window.close()}>Đóng</Button>
        <Button onClick={() => window.print()}>In / Lưu PDF</Button>
      </div>
      <article
        className="mx-auto max-w-[210mm] bg-white px-[20mm] py-[20mm] text-justify text-[13pt] leading-[1.5] text-black shadow print:shadow-none"
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
      >
        {m.status !== "approved" && <p className="text-right text-[11pt] italic">Bản nháp – chưa được duyệt</p>}
        <h1 className="text-center text-[16pt] font-bold">BIÊN BẢN HỌP</h1>
        <p className="mb-4 text-center font-bold">{m.title}</p>
        {docMeta(m).map(([k, v]) => (
          <p key={k}>
            <b>{k}:</b> {v}
          </p>
        ))}
        <h2 className="mt-4 font-bold">1. Mục đích cuộc họp</h2>
        <p>{m.info.purpose || "Chưa xác định."}</p>
        <h2 className="mt-4 font-bold">2. {sec.summary}</h2>
        {docTopics(m).map((g, i) => (
          <div key={g.topic || i}>
            {g.topic && (
              <p className="mt-1 font-bold italic">
                2.{i + 1}. {g.topic}
              </p>
            )}
            {g.items.map((it) => (
              <p key={it.id}>{it.text}</p>
            ))}
          </div>
        ))}
        <h2 className="mt-4 font-bold">3. {sec.decisions}</h2>
        <Dashes items={m.minutes.decisions} />
        <h2 className="mt-4 font-bold">4. {sec.actions}</h2>
        <table className="mt-1 w-full border-collapse text-left text-[12pt]">
          <thead>
            <tr>
              {["STT", "Nội dung công việc", "Người phụ trách", "Thời hạn"].map((h) => (
                <th key={h} className="border border-black px-2 py-1">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.minutes.actions.map((a, i) => (
              <tr key={a.id}>
                <td className="border border-black px-2 py-1 text-center">{i + 1}</td>
                <td className="border border-black px-2 py-1">{a.text}</td>
                <td className="border border-black px-2 py-1">{a.owner || "Chưa xác định"}</td>
                <td className="border border-black px-2 py-1">{a.deadline || "Chưa xác định"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2 className="mt-4 font-bold">5. {sec.openIssues}</h2>
        <Dashes items={m.minutes.openIssues} />
        <p className="mt-6">{docClosing(m)}</p>
        <div className="mt-6 grid grid-cols-2 text-center">
          {[
            ["THƯ KÝ", m.info.secretary],
            ["CHỦ TRÌ", m.info.chair],
          ].map(([role, name]) => (
            <div key={role}>
              <p className="font-bold">{role}</p>
              <p className="text-[11pt] italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-20" />
              <p>{name}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
