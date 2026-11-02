// Kịch bản mẫu thay cho model AI trong bản demo giao diện.
// Khi nối model thật, phần này được thay bằng kết quả từ API chép lời + LLM.
// Văn phong biên bản: câu hoàn chỉnh, có chủ ngữ (ai nói/ai đề xuất), nhóm theo chủ đề – giống thư ký viết.
import type { ActionItem, MeetingInfo, Minutes, MinutesItem, Segment, Speaker } from "./types";

export interface Scenario {
  id: string;
  defaultTitle: string;
  templateId: string;
  info: MeetingInfo;
  speakers: Speaker[];
  segments: Segment[];
  minutes: Minutes;
}

const sp = (n: number, suggested?: string, evidence?: string): Speaker => ({
  id: `s${n}`,
  label: `Speaker ${n}`,
  name: "",
  ...(suggested ? { suggested, evidence } : {}),
});

function segs(rows: [number, number, string][]): Segment[] {
  return rows.map(([speaker, start, text], i) => {
    const next = rows[i + 1];
    return { id: `g${i + 1}`, speakerId: `s${speaker}`, start, end: next ? next[1] : start + 20, text };
  });
}

const item = (id: string, text: string, sources: string[], low?: string, topic?: string): MinutesItem => ({
  id,
  text,
  sources,
  confidence: low ? "low" : "high",
  note: low,
  confirmed: !low,
  ...(topic ? { topic } : {}),
});

const said = (id: string, topic: string, text: string, sources: string[], low?: string) => item(id, text, sources, low, topic);

const action = (
  id: string,
  text: string,
  owner: string,
  deadline: string,
  sources: string[],
  low?: string,
): ActionItem => ({ ...item(id, text, sources, low), owner, deadline });

const sprint: Scenario = {
  id: "sprint",
  defaultTitle: "Sprint Planning #14 – App Giao Hàng",
  templateId: "sprint",
  info: {
    purpose: "Lập kế hoạch Sprint 14, mục tiêu phát hành phiên bản 2.3 với tính năng theo dõi đơn hàng theo thời gian thực.",
    startTime: "14:00",
    chair: "Anh Minh",
    secretary: "",
    location: "Họp trực tuyến (Google Meet)",
    attendees: "",
  },
  speakers: [sp(1, "Anh Minh", "g13"), sp(2, "Nam", "g3"), sp(3, "Linh", "g7"), sp(4, "Chị Hà", "g7")],
  segments: segs([
    [1, 0, "Ok mọi người, mình bắt đầu sprint planning số 14 nhé. Mục tiêu sprint này là release được bản 2.3 cho app giao hàng, tập trung vào tính năng theo dõi đơn real-time."],
    [2, 18, "Bên backend thì API tracking em làm xong khoảng 70% rồi, còn phần WebSocket push vị trí shipper. Em ước tính cần thêm khoảng 3 ngày."],
    [1, 34, "3 ngày thì ổn. Vậy Nam chốt deadline API tracking là thứ Năm tuần này, ngày 30 nhé."],
    [2, 42, "Dạ ok anh, thứ Năm em xong."],
    [3, 47, "Về phía mobile, màn hình bản đồ em đang bị chậm trên máy Android đời cũ, load map mất gần 4 giây. Em nghĩ nên chuyển sang dùng lazy load cho marker."],
    [4, 66, "Chị thấy lazy load hợp lý. Nhưng mình cần test lại trên mấy máy cấu hình thấp, bên QA có sẵn 3 máy test."],
    [1, 80, "Được, vậy mình chốt là dùng lazy load cho marker trên màn hình bản đồ. Linh lo phần này, còn chị Hà bên QA test performance sau khi Linh merge."],
    [3, 95, "Em làm xong chắc tầm đầu tuần sau, nhưng còn phụ thuộc API của anh Nam nữa."],
    [4, 104, "Chị sẽ viết test case cho luồng tracking trước, khi nào có build thì chạy luôn."],
    [1, 115, "Còn một việc nữa là cái bug thanh toán VNPay hôm trước khách report, bị trừ tiền hai lần. Cái này priority cao nhất, phải fix trước khi release."],
    [2, 131, "Em check log rồi, nguyên nhân là callback bị gọi lại khi timeout. Em sẽ thêm idempotency key, chắc làm trong hôm nay hoặc mai là xong."],
    [1, 146, "Tốt, Nam fix luôn bug VNPay, xong báo anh review. Mình sẽ không release 2.3 nếu bug này chưa đóng."],
    [4, 158, "Thế còn tính năng đánh giá shipper, có đưa vào sprint này không anh Minh?"],
    [1, 166, "Cái đó để sprint sau đi, sprint này scope đã khá nặng rồi. Mình cần confirm thêm với bên business về tiêu chí đánh giá."],
    [3, 180, "Em đề xuất mình có buổi sync nhanh với bên design về icon trạng thái đơn, hiện đang chưa thống nhất."],
    [1, 192, "Ừ, Linh sắp xếp buổi đó giúp anh, cuối tuần cũng được. Ok, vậy mình tổng kết lại: release 2.3 dự kiến thứ Ba tuần sau nếu QA pass hết. Cảm ơn mọi người."],
  ]),
  minutes: {
    summary: [
      said("m1", "Tiến độ tính năng theo dõi đơn hàng", "Nam (Backend) báo cáo API tracking đã hoàn thành khoảng 70%, phần còn lại là WebSocket đẩy vị trí shipper, cần thêm khoảng 3 ngày.", ["g2"]),
      said("m2", "Tiến độ tính năng theo dõi đơn hàng", "Linh (Mobile) cho biết màn hình bản đồ tải chậm trên các máy Android đời cũ (gần 4 giây) và đề xuất chuyển sang lazy load cho marker. Chị Hà (QA) đồng ý, đề nghị kiểm thử lại trên 3 máy cấu hình thấp của QA.", ["g5", "g6"]),
      said("m3", "Lỗi thanh toán VNPay", "Khách hàng phản ánh bị trừ tiền hai lần khi thanh toán qua VNPay. Nam đã kiểm tra log, nguyên nhân là callback bị gọi lại khi timeout; hướng xử lý là bổ sung idempotency key.", ["g10", "g11"]),
      said("m4", "Phạm vi sprint", "Chị Hà hỏi về việc đưa tính năng đánh giá shipper vào sprint này. Anh Minh cho rằng phạm vi sprint đã khá nặng và cần thống nhất tiêu chí đánh giá với bộ phận business trước.", ["g13", "g14"]),
      said("m5", "Phạm vi sprint", "Linh đề xuất họp nhanh với team design để thống nhất bộ icon trạng thái đơn.", ["g15"]),
    ],
    decisions: [
      item("d1", "Áp dụng lazy load cho marker trên màn hình bản đồ.", ["g7"]),
      item("d2", "Lỗi VNPay là ưu tiên cao nhất; chỉ phát hành bản 2.3 khi lỗi này đã được xử lý xong.", ["g10", "g12"]),
      item("d3", "Tính năng đánh giá shipper chuyển sang sprint sau.", ["g14"]),
      item("d4", "Dự kiến phát hành bản 2.3 vào thứ Ba tuần sau, với điều kiện QA kiểm thử đạt toàn bộ.", ["g16"], "Ngày phát hành có điều kiện (phụ thuộc kết quả QA)."),
    ],
    actions: [
      action("a1", "Hoàn thiện API tracking (WebSocket đẩy vị trí shipper)", "Nam", "Thứ Năm, 30/10", ["g3", "g4"]),
      action("a2", "Sửa lỗi trừ tiền hai lần khi thanh toán VNPay (bổ sung idempotency key), gửi anh Minh review", "Nam", "Hôm nay hoặc ngày mai", ["g11", "g12"], "Người nói chỉ ước lượng \"hôm nay hoặc mai\", chưa chốt ngày."),
      action("a3", "Áp dụng lazy load cho marker màn hình bản đồ", "Linh", "Đầu tuần sau", ["g7", "g8"], "Thời hạn phụ thuộc API tracking của Nam."),
      action("a4", "Viết test case luồng tracking; kiểm thử hiệu năng sau khi Linh merge", "Chị Hà", "Khi có bản build", ["g7", "g9"]),
      action("a5", "Sắp xếp buổi trao đổi với team design về icon trạng thái đơn", "Linh", "Cuối tuần này", ["g15", "g16"]),
    ],
    openIssues: [
      item("o1", "Tiêu chí đánh giá shipper: cần thống nhất với bộ phận business trước khi đưa vào sprint.", ["g14"]),
      item("o2", "Bộ icon trạng thái đơn chưa thống nhất giữa dev và design.", ["g15"]),
    ],
  },
};

const client: Scenario = {
  id: "client",
  defaultTitle: "Họp khách hàng – Chiến dịch Tết Ngọc Lan Cosmetics",
  templateId: "client",
  info: {
    purpose: "Trao đổi proposal chiến dịch Tết 2027 với Ngọc Lan Cosmetics: ngân sách KOL, timeline và cách báo cáo.",
    startTime: "10:00",
    chair: "Tuấn",
    secretary: "",
    location: "Văn phòng Ngọc Lan Cosmetics",
    attendees: "",
  },
  speakers: [sp(1, "Tuấn", "g4"), sp(2, "Chị Lan", "g1"), sp(3)],
  segments: segs([
    [1, 0, "Em chào chị Lan, hôm nay bên em gửi chị bản proposal chiến dịch Tết, tập trung vào TikTok và KOL tầm trung."],
    [2, 14, "Chị đọc rồi. Nhìn chung concept \"Tết rạng rỡ\" chị thích, nhưng budget KOL đang hơi cao, khoảng 60% tổng ngân sách."],
    [3, 30, "Dạ, bên em có thể giảm xuống còn khoảng 45% và chuyển phần còn lại sang ads chuyển đổi trên TikTok Shop."],
    [2, 44, "Ok, chị đồng ý phương án 45%. Nhưng Tuấn gửi chị danh sách KOL cụ thể trước khi chị duyệt nhé."],
    [1, 56, "Dạ vâng, em gửi chị shortlist 10 KOL kèm số liệu engagement trước thứ Sáu này nhé."],
    [2, 68, "Được. Thêm nữa, timeline chị muốn chạy sớm hơn, khoảng 15 tháng Một là phải lên bài đầu tiên."],
    [3, 82, "15/1 thì hơi gấp cho phần quay video, nhưng nếu chị duyệt KOL trong tuần sau thì bên em kịp."],
    [2, 95, "Vậy mình chốt ngày go-live là 15/1 nhé. Còn phần báo cáo thì chị cần report theo tuần, có số liệu doanh thu từ TikTok Shop."],
    [1, 110, "Dạ, bên em sẽ làm dashboard report hàng tuần. Còn phần quyền truy cập TikTok Shop thì chị cấp cho bên em giúp em."],
    [2, 122, "Ừ, để chị nhờ bạn bên IT cấp quyền, chắc trong tuần này."],
    [3, 131, "Một điểm nữa là chị có muốn làm thêm minigame trên fanpage không ạ? Bên em thấy năm ngoái minigame kéo được khá nhiều follow."],
    [2, 144, "Cái này chị phải hỏi lại sếp, chưa chốt được. Em cứ gửi chị ước tính chi phí trước."],
    [1, 156, "Dạ vâng ạ. Em tổng kết lại các đầu việc và gửi biên bản cho chị trong hôm nay."],
  ]),
  minutes: {
    summary: [
      said("m1", "Proposal và ngân sách", "Agency trình bày proposal chiến dịch Tết tập trung vào TikTok và KOL tầm trung. Chị Lan đồng ý với concept \"Tết rạng rỡ\" nhưng cho rằng ngân sách KOL (khoảng 60% tổng ngân sách) còn cao.", ["g1", "g2"]),
      said("m2", "Proposal và ngân sách", "Agency đề xuất giảm ngân sách KOL xuống khoảng 45%, phần còn lại chuyển sang quảng cáo chuyển đổi trên TikTok Shop.", ["g3"]),
      said("m3", "Timeline", "Chị Lan muốn chiến dịch lên bài đầu tiên vào khoảng 15/01. Agency cho biết thời gian quay video khá gấp nhưng vẫn kịp nếu danh sách KOL được duyệt trong tuần sau.", ["g6", "g7"]),
      said("m4", "Báo cáo", "Chị Lan yêu cầu báo cáo theo tuần, có số liệu doanh thu từ TikTok Shop; agency cần được cấp quyền truy cập TikTok Shop.", ["g8", "g9"]),
    ],
    decisions: [
      item("d1", "Giảm ngân sách KOL xuống 45%, phần còn lại dành cho quảng cáo chuyển đổi trên TikTok Shop.", ["g3", "g4"]),
      item("d2", "Ngày go-live chiến dịch: 15/01.", ["g8"], "Agency nêu điều kiện là KOL phải được duyệt trong tuần sau."),
    ],
    actions: [
      action("a1", "Gửi shortlist 10 KOL kèm số liệu engagement", "Tuấn", "Thứ Sáu tuần này", ["g4", "g5"]),
      action("a2", "Duyệt danh sách KOL", "Chị Lan", "Tuần sau", ["g7"], "Thời hạn do agency đề xuất, chị Lan chưa xác nhận trực tiếp."),
      action("a3", "Xây dựng dashboard báo cáo hàng tuần", "Tuấn", "Chưa xác định", ["g9"]),
      action("a4", "Cấp quyền truy cập TikTok Shop cho agency", "Chị Lan", "Trong tuần này", ["g9", "g10"]),
      action("a5", "Gửi ước tính chi phí minigame trên fanpage", "Speaker 3", "Chưa xác định", ["g11", "g12"]),
    ],
    openIssues: [item("o1", "Minigame trên fanpage: chị Lan cần hỏi ý kiến cấp trên trước khi quyết định.", ["g12"])],
  },
};

const weekly: Scenario = {
  id: "weekly",
  defaultTitle: "Giao ban tuần 43 – Phòng Vận hành",
  templateId: "weekly",
  info: {
    purpose: "Giao ban tuần 43: các bộ phận báo cáo tình hình và thống nhất việc cần làm trong tuần.",
    startTime: "08:30",
    chair: "Anh Quân",
    secretary: "",
    location: "Phòng họp tầng 3",
    attendees: "",
  },
  speakers: [sp(1, "Anh Quân", "g10"), sp(2, "Mai", "g9"), sp(3, "Tuấn", "g4"), sp(4)],
  segments: segs([
    [1, 0, "Bắt đầu giao ban tuần 43. Từng bộ phận báo cáo nhanh giúp anh, mỗi người tầm 2 phút."],
    [2, 10, "Bên CSKH tuần này nhận 420 ticket, tăng 15% so với tuần trước, chủ yếu do lỗi đăng nhập sau bản update. SLA phản hồi vẫn đạt 92%."],
    [3, 27, "Bên kho thì tồn kho đang ổn, nhưng có 2 đơn nhập hàng từ nhà cung cấp bị chậm 5 ngày, ảnh hưởng tới hàng khuyến mãi 11/11."],
    [1, 44, "Đơn chậm này phải xử lý gấp. Tuấn liên hệ lại nhà cung cấp, nếu đến thứ Tư chưa có hàng thì chuyển sang nhà cung cấp dự phòng."],
    [3, 58, "Dạ em gọi luôn chiều nay."],
    [4, 62, "Bên nhân sự thì đang tuyển 3 bạn CSKH part-time cho mùa sale, đã có 12 CV, dự kiến phỏng vấn trong tuần."],
    [1, 78, "Ok. Chốt là ưu tiên tuyển đủ 3 bạn trước ngày 5/11 để kịp training."],
    [2, 88, "Về lỗi đăng nhập, em đề xuất mình làm một bài hướng dẫn và gửi cho khách qua email để giảm ticket."],
    [1, 99, "Được, Mai làm bài hướng dẫn, gửi anh duyệt rồi gửi khách. Còn bên tech thì anh sẽ nhắc trực tiếp."],
    [4, 112, "Anh Quân ơi, còn vụ thưởng KPI quý 3 thì bao giờ chốt ạ? Nhân viên đang hỏi nhiều."],
    [1, 120, "Cái này anh cần họp với ban giám đốc đã, chưa trả lời được trong buổi này."],
  ]),
  minutes: {
    summary: [
      said("m1", "Chăm sóc khách hàng", "Mai báo cáo CSKH nhận 420 ticket trong tuần, tăng 15% so với tuần trước, chủ yếu do lỗi đăng nhập sau bản cập nhật; SLA phản hồi vẫn đạt 92%.", ["g2"]),
      said("m2", "Kho vận", "Tuấn báo cáo tồn kho ổn định, tuy nhiên 2 đơn nhập hàng từ nhà cung cấp bị chậm 5 ngày, ảnh hưởng tới hàng khuyến mãi 11/11.", ["g3"]),
      said("m3", "Nhân sự", "Bộ phận nhân sự đang tuyển 3 nhân viên CSKH part-time cho mùa sale, đã nhận 12 CV và dự kiến phỏng vấn trong tuần.", ["g6"]),
    ],
    decisions: [
      item("d1", "Nếu đến thứ Tư chưa nhận được hàng, chuyển sang nhà cung cấp dự phòng.", ["g4"]),
      item("d2", "Ưu tiên tuyển đủ 3 nhân viên CSKH part-time trước ngày 05/11 để kịp đào tạo.", ["g7"]),
      item("d3", "Soạn bài hướng dẫn xử lý lỗi đăng nhập và gửi cho khách hàng qua email để giảm số ticket.", ["g8", "g9"]),
    ],
    actions: [
      action("a1", "Liên hệ nhà cung cấp về 2 đơn nhập hàng bị chậm", "Tuấn", "Chiều nay", ["g4", "g5"]),
      action("a2", "Tuyển đủ 3 nhân viên CSKH part-time", "Speaker 4 (Nhân sự)", "05/11", ["g6", "g7"], "Chưa xác định được tên người phụ trách bên nhân sự."),
      action("a3", "Soạn bài hướng dẫn lỗi đăng nhập, gửi anh Quân duyệt rồi gửi khách hàng", "Mai", "Chưa xác định", ["g9"]),
      action("a4", "Trao đổi với team tech về lỗi đăng nhập", "Anh Quân", "Chưa xác định", ["g9"]),
    ],
    openIssues: [item("o1", "Thưởng KPI quý 3: chờ anh Quân họp với ban giám đốc.", ["g10", "g11"])],
  },
};

export const SCENARIOS: Record<string, Scenario> = { sprint, client, weekly };

export function scenarioForTemplate(templateId: string): Scenario {
  if (templateId === "client" || templateId === "agency") return client;
  if (templateId === "weekly") return weekly;
  return sprint;
}
