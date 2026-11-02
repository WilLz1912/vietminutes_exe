export type MeetingStatus = "processing" | "draft" | "approved" | "failed";
export type Engine = "backend" | "mock";

export interface AuditEntry {
  at: number;
  text: string;
}
export type MeetingSource = "upload" | "record" | "extension";
export type Confidence = "high" | "low";

export interface Speaker {
  id: string;
  label: string; // "Speaker 1"
  name: string; // tên thật sau khi đổi, rỗng nếu chưa đổi
  suggested?: string; // tên AI đoán từ nội dung (vd. người khác gọi tên), chờ người dùng áp dụng
  evidence?: string; // id đoạn transcript làm căn cứ cho tên gợi ý
}

export interface Segment {
  id: string;
  speakerId: string;
  start: number; // giây
  end: number;
  text: string;
}

export interface MinutesItem {
  id: string;
  text: string;
  sources: string[]; // id các đoạn transcript làm căn cứ
  confidence: Confidence;
  note?: string; // lý do AI chưa chắc
  confirmed: boolean;
  topic?: string; // chủ đề (chỉ dùng cho phần nội dung thảo luận)
}

export interface ActionItem extends MinutesItem {
  owner: string;
  deadline: string;
}

export interface Minutes {
  summary: MinutesItem[];
  decisions: MinutesItem[];
  actions: ActionItem[];
  openIssues: MinutesItem[];
}

export interface MeetingInfo {
  purpose: string; // mục đích / chủ đề cuộc họp
  startTime: string; // "14:00"
  chair: string;
  secretary: string;
  location: string;
  attendees: string;
}

export interface Meeting {
  id: string;
  title: string;
  createdAt: number;
  meetingDate: string; // yyyy-mm-dd
  duration: number; // giây
  source: MeetingSource;
  fileName: string;
  fileSize: number;
  templateId: string;
  status: MeetingStatus;
  processingStartedAt?: number;
  scenario: string; // id kịch bản mẫu dùng cho bản demo (thay cho model)
  info: MeetingInfo;
  speakers: Speaker[];
  segments: Segment[];
  minutes: Minutes;
  approvedAt?: number;
  audioExpiresAt: number;
  sample?: boolean; // cuộc họp mẫu, không tính vào hạn mức
  engine: Engine; // backend = AI service thật (2 hộp), mock = giả lập ngay trên trình duyệt
  jobId?: string;
  stage?: string; // nhãn bước đang chạy do backend báo
  audit?: AuditEntry[]; // nhật ký xử lý & bảo mật (không chứa nội dung họp)
  error?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  sections: { summary: string; decisions: string; actions: string; openIssues: string };
}

export interface GlossaryEntry {
  id: string;
  term: string;
  meaning: string;
}

export interface DeletionLog {
  id: string;
  at: number;
  what: string;
}

export type Plan = "free" | "premium";
