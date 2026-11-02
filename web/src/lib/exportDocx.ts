import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { docClosing, docMeta, docSections, docTopics } from "./minutesDoc";
import type { Meeting, MinutesItem } from "./types";

const FONT = "Times New Roman";
const SIZE = 26; // 13pt – cỡ chữ văn bản hành chính thường dùng

const run = (text: string, o: { bold?: boolean; italics?: boolean; size?: number } = {}) =>
  new TextRun({ text, bold: o.bold, italics: o.italics, size: o.size ?? SIZE, font: FONT });

const para = (children: TextRun[], o: { align?: (typeof AlignmentType)[keyof typeof AlignmentType]; before?: number; after?: number; indent?: number } = {}) =>
  new Paragraph({
    alignment: o.align ?? AlignmentType.JUSTIFIED,
    spacing: { before: o.before ?? 0, after: o.after ?? 80, line: 312 },
    indent: o.indent ? { left: o.indent } : undefined,
    children,
  });

const heading = (text: string) => para([run(text, { bold: true })], { before: 200, after: 80, align: AlignmentType.LEFT });

const bullets = (items: MinutesItem[]) =>
  items.length ? items.map((i) => para([run(`- ${i.text}`)], { indent: 360 })) : [para([run("Không có.", { italics: true })], { indent: 360 })];

const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const line = { style: BorderStyle.SINGLE, size: 4, color: "000000" };

const cell = (text: string, o: { bold?: boolean; width?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) =>
  new TableCell({
    width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ alignment: o.align, children: [run(text, { bold: o.bold, size: 24 })] })],
  });

export async function exportDocx(m: Meeting): Promise<void> {
  const sec = docSections(m);
  const topics = docTopics(m);

  const actionTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          cell("STT", { bold: true, width: 8, align: AlignmentType.CENTER }),
          cell("Nội dung công việc", { bold: true, width: 50 }),
          cell("Người phụ trách", { bold: true, width: 21 }),
          cell("Thời hạn", { bold: true, width: 21 }),
        ],
      }),
      ...m.minutes.actions.map(
        (a, i) =>
          new TableRow({
            children: [cell(String(i + 1), { align: AlignmentType.CENTER }), cell(a.text), cell(a.owner || "Chưa xác định"), cell(a.deadline || "Chưa xác định")],
          }),
      ),
    ],
  });

  const signatures = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
    rows: [
      new TableRow({
        children: [
          ["THƯ KÝ", m.info.secretary],
          ["CHỦ TRÌ", m.info.chair],
        ].map(
          ([role, name]) =>
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                para([run(role, { bold: true })], { align: AlignmentType.CENTER, after: 0 }),
                para([run("(Ký, ghi rõ họ tên)", { italics: true, size: 22 })], { align: AlignmentType.CENTER, after: 900 }),
                para([run(name || "")], { align: AlignmentType.CENTER }),
              ],
            }),
        ),
      }),
    ],
  });

  const doc = new Document({
    creator: "VietMinutes",
    title: m.title,
    sections: [
      {
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 } } },
        children: [
          ...(m.status !== "approved" ? [para([run("BẢN NHÁP – CHƯA ĐƯỢC DUYỆT", { italics: true, size: 22 })], { align: AlignmentType.RIGHT })] : []),
          para([run("BIÊN BẢN HỌP", { bold: true, size: 32 })], { align: AlignmentType.CENTER, after: 40 }),
          para([run(m.title, { bold: true })], { align: AlignmentType.CENTER, after: 240 }),
          ...docMeta(m).map(([k, v]) => para([run(`${k}: `, { bold: true }), run(v)], { after: 40, align: AlignmentType.LEFT })),
          heading("1. Mục đích cuộc họp"),
          para([run(m.info.purpose || "Chưa xác định.")]),
          heading(`2. ${sec.summary}`),
          ...topics.flatMap((g, i) => [
            ...(g.topic ? [para([run(`2.${i + 1}. ${g.topic}`, { bold: true, italics: true })], { before: 80, align: AlignmentType.LEFT })] : []),
            ...g.items.map((it) => para([run(it.text)])),
          ]),
          heading(`3. ${sec.decisions}`),
          ...bullets(m.minutes.decisions),
          heading(`4. ${sec.actions}`),
          actionTable,
          heading(`5. ${sec.openIssues}`),
          ...bullets(m.minutes.openIssues),
          para([run(docClosing(m))], { before: 240, after: 360 }),
          signatures,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Bien ban - ${m.title.replace(/[\\/:*?"<>|]/g, "")}.docx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
