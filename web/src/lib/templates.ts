import type { Template } from "./types";

export const TEMPLATES: Template[] = [
  {
    id: "project",
    name: "Họp dự án",
    description: "Cập nhật tiến độ, rủi ro và phân công trong dự án.",
    sections: {
      summary: "Nội dung thảo luận",
      decisions: "Kết luận",
      actions: "Phân công công việc",
      openIssues: "Rủi ro và vấn đề cần theo dõi",
    },
  },
  {
    id: "client",
    name: "Họp khách hàng",
    description: "Ghi nhận yêu cầu, phản hồi và cam kết với khách hàng.",
    sections: {
      summary: "Nội dung trao đổi",
      decisions: "Các điểm hai bên đã thống nhất",
      actions: "Việc cần làm",
      openIssues: "Điểm cần làm rõ thêm",
    },
  },
  {
    id: "weekly",
    name: "Họp giao ban",
    description: "Báo cáo tuần của các bộ phận và chỉ đạo của quản lý.",
    sections: {
      summary: "Báo cáo của các bộ phận",
      decisions: "Kết luận của chủ trì",
      actions: "Phân công công việc trong tuần",
      openIssues: "Vấn đề còn tồn đọng",
    },
  },
  {
    id: "sprint",
    name: "Họp sprint",
    description: "Sprint planning / review: mục tiêu, task và blocker.",
    sections: {
      summary: "Nội dung thảo luận",
      decisions: "Kết luận",
      actions: "Phân công công việc",
      openIssues: "Vấn đề cần theo dõi",
    },
  },
  {
    id: "agency",
    name: "Họp nội bộ agency",
    description: "Brainstorm chiến dịch, phân công nội dung và timeline.",
    sections: {
      summary: "Nội dung thảo luận",
      decisions: "Phương án được chốt",
      actions: "Phân công công việc",
      openIssues: "Vấn đề còn mở",
    },
  },
];

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
