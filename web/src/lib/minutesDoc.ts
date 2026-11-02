// Cấu trúc chung của biên bản để xuất Word và trang in dùng cùng một bố cục.
import { getTemplate } from "./templates";
import type { Meeting, MinutesItem } from "./types";
import { endTime, fmtDate, fmtDuration } from "./utils";

export function docMeta(m: Meeting): [string, string][] {
  const i = m.info;
  const time = i.startTime ? `${i.startTime} – ${endTime(i.startTime, m.duration)}, ngày ${fmtDate(m.meetingDate)}` : `Ngày ${fmtDate(m.meetingDate)}`;
  return [
    ["Thời gian", `${time} (${fmtDuration(m.duration)})`],
    ["Địa điểm", i.location || "Chưa xác định"],
    ["Chủ trì", i.chair || "Chưa xác định"],
    ["Thư ký", i.secretary || "Chưa xác định"],
    ["Thành phần tham dự", m.speakers.map((s) => s.name || s.label).join(", ")],
  ];
}

export function docTopics(m: Meeting): { topic: string; items: MinutesItem[] }[] {
  const out: { topic: string; items: MinutesItem[] }[] = [];
  for (const it of m.minutes.summary) {
    const g = out.find((x) => x.topic === (it.topic ?? ""));
    if (g) g.items.push(it);
    else out.push({ topic: it.topic ?? "", items: [it] });
  }
  return out;
}

export function docSections(m: Meeting) {
  return getTemplate(m.templateId).sections;
}

export function docClosing(m: Meeting): string {
  const end = m.info.startTime ? endTime(m.info.startTime, m.duration) : "";
  return `Cuộc họp kết thúc${end ? ` lúc ${end} cùng ngày` : ""}. Biên bản được lập và thống nhất bởi các thành viên tham dự.`;
}
