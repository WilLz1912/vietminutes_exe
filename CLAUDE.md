<!-- last-compacted: 2026-11-08T17:30 -->
# EXE — VietMinutes (EXE101, Group 1)

## Cách ghi & làm gọn file này
Mục đích: đọc file này là đủ hiểu dự án để làm tiếp, không cần Quang giải thích lại.
Không giới hạn số dòng; mỗi dòng phải đáng tiền. Ghi ngay trong lúc làm (quyết định, phát hiện, lời sửa).
Giữ: quyết định + lý do, phương án đã bỏ, yêu cầu/lời sửa của Quang, kết quả tốn công, bẫy, trạng thái, bản đồ file.
Thay bằng con trỏ: chi tiết đã có trong code/doc. Bỏ: diễn biến từng bước, lệnh đã chạy.
Khi làm gọn (hook nhắc 12h/lần): gộp nhật ký vào mục chủ đề; thứ ít dùng → `CLAUDE.archive.md` + con trỏ; cập nhật `last-compacted`.

## Dự án
VietMinutes – trợ lý AI tạo biên bản họp tiếng Việt: tải file/thu âm → chép lời + tách người nói → biên bản (quyết định,
việc, người phụ trách, deadline) **kèm dẫn chiếu câu gốc**, mục AI chưa chắc tô vàng, người dùng xác nhận (Bản nháp → Đã duyệt) → xuất DOCX/PDF.
Web App trước; Chrome Extension Google Meet ở vòng 3. Beachhead: công ty công nghệ/agency 20–80 nhân sự dùng Google Meet.
- Nguồn: Google Doc chính `1XrLWA-Knfic6g-uw6XkEV3VyUtajZRisIiTghRAslZM` (CP1, CP2, outline CP4, lẫn bài thuyết trình lý thuyết);
  Doc CP3 `1pzZQdsZV6D9oVYw1zxtmIDtmwAqcG1CeLkiVOhRafwY` (7Ps + SRS US01–US15). Tải bằng `/export?format=txt`.
- Nhận xét mentor: `Nhan_xet_Product_Process_VietMinutes.docx` (19/10) – là lý do CP3 viết lại SRS.
- Slide Canva dự án duy nhất tìm thấy: CP1 (canva.link/5n4a7fcvyhoy9xz). Text Canva lấy được từ JSON trong trang /view.

## Quy tắc của Quang
- CP không tin ngang nhau: **CP sau thắng**, hoặc theo cái hợp logic hơn; tự chốt chỗ lệch, đừng liệt kê hết.
- Giá chốt CP4 (8/11, theo sheet tài chính + RP): Free 3 biên bản/tháng; Premium 199.000đ/tháng (tháng đầu miễn phí) hoặc 2.099.000đ/năm
  (năm đầu 1.590.000đ, giảm 24%), 15 biên bản/tháng, tính theo doanh nghiệp; mua thêm 29.000đ/5 biên bản đầu + 39.000đ/5 tiếp, tối đa 25/tháng.
  Web đã cập nhật ở landing, /billing, hộp hết hạn mức. (Giá cũ CP3 109k/tháng, 1.159k/năm đã bỏ.)
- Team (CP3): Hiền CEO 25%; Linh AI; **Quang Web App**; Hoàng Extension; Kiệt Marketing; Bình Sales – mỗi người 15%.

## Trạng thái demo (kiểm tra thực tế 30/10)
- **Chế độ giả lập chạy trọn luồng**: build, eslint, tsc, 7 test AI sạch; duyệt bằng trình duyệt thật qua web + AI service: landing → đăng nhập → cấp quyền → hướng dẫn
  → tải file → biên bản → áp dụng tên → xác nhận → duyệt → Word → nhật ký → trang in + các trang phụ, không có lỗi console.
- **AI thật chưa từng chạy**: chưa có `ai/.env`, chưa có key, chưa có file họp thật. Thử key giả qua cổng riêng: hộp ra được mạng, Soniox/Deepgram trả 401, Gemini trả 400
  (nhiều khả năng do key giả, chưa phân biệt được vì lỗi bên dưới). Phần đọc kết quả + chất lượng tiếng Việt chưa kiểm chứng.
- Lỗi đã thấy, chưa sửa:
  - `sandbox.py` lấy dòng stderr cuối làm thông báo → người dùng chỉ thấy "For more information check: …/Status/401", mất nguyên nhân.
  - Kịch bản sprint + landing ghi "Thứ Năm, 30/10", nhưng 30/10/2026 là thứ Sáu (`scenarios.ts:97`, `app/page.tsx:59`, lời thoại kịch bản).
- Giới hạn giả lập phải biết khi trình bày: `stt.mock` bỏ qua audio, file/giọng nào cũng ra kịch bản có sẵn. `demo/sample.wav` là tiếng bíp 20s (không phải giọng nói),
  nên "Nghe câu gốc" không khớp lời thoại.
- Upload chỉ nhận mp3/wav/m4a/webm: bản ghi Google Meet dạng mp4 chưa tải trực tiếp được.
- Git riêng ở `D:\EXE` (3/11), remote https://github.com/WilLz1912/vietminutes_exe (main). `.claude/` không đưa lên (đường dẫn hook cá nhân).
- Vercel (3/11): https://web-henna-one-26.vercel.app — project `web` (tài khoản quang191204-8665), chỉ deploy `web/`, chế độ giả lập (AI service không lên Vercel).
  **GitHub CHƯA nối Vercel** (8/11: push `main` không tạo deploy nào dù Quang tưởng đã nối) → deploy bằng `cd web && npx vercel --prod --yes` (CLI đã login sẵn).
  Muốn tự deploy: Vercel → project `web` → Settings → Git, nối repo, Root Directory = `web`. `vietminutes.vercel.app` trả 404 (có thể còn trống để đặt tên).
  Ổ C từng đầy 100% (8/11) → npx lỗi ENOSPC; nếu tái diễn, đặt `npm_config_cache`, `TEMP`, `TMP` sang ổ D.

## Web demo (`web/`)
Yêu cầu Quang: giao diện chạy được trên localhost, bấm được mọi nút/luồng.
- Stack: Next.js 16.4 (App Router) + React 19 + Tailwind v4 + zustand (persist localStorage key `vietminutes-demo`) + `docx` + lucide-react.
- Chạy: `cd web && npm run dev` → http://localhost:3000.
- Giả lập trên trình duyệt: `src/lib/scenarios.ts` (3 kịch bản sprint/client/weekly, chọn theo mẫu biên bản); thời gian xử lý ở `STAGES` trong `src/lib/store.ts`.
- Thật: thu âm micro (MediaRecorder), đọc thời lượng file, phát audio đã tải lên (chỉ trong phiên), xuất DOCX, PDF qua `/print/[id]` + window.print. Đăng nhập Google, thanh toán QR, extension đều giả.
- Màn hình: `/` landing+bảng giá, `/login`, `/onboarding` 1 màn, `(app)/dashboard`, `(app)/meetings/[id]` (xử lý → editor 2 cột),
  `(app)/templates`, `(app)/settings` (từ điển, xóa dữ liệu + nhật ký, trạng thái AI service, đặt lại demo), `(app)/billing`, `(app)/extension` (mô phỏng popup trên Meet).
- Nối AI: `src/lib/ai.ts` (health/submit/poll/ack); không có backend hoặc thiếu key → tự dùng giả lập trên trình duyệt. Meeting có `engine`, `audit` (nhật ký không chứa nội dung), trạng thái `failed`. Giữ kiểu dữ liệu `src/lib/types.ts` (Segment có id, MinutesItem.sources = id đoạn gốc).

## Thiết kế UI (chốt 24–25/10, sau 2 vòng góp ý của Quang)
- Quang KHÔNG muốn: bo tròn nhiều + lưới card icon/tiêu đề/mô tả kiểu "AI" (vòng 1); và cũng KHÔNG muốn hướng retro "giấy & mực"
  serif (vòng 2 – đã bỏ). Muốn: giao diện công cụ hiện đại cho công ty công nghệ SME, **flow rõ: bấm gì, không bấm gì**.
- Hiện tại: nền trắng, 1 màu hành động xanh (brand-600 `#2563eb`), Inter + IBM Plex Mono, radius 6–8px; token ở `web/src/app/globals.css`.
  Mỗi màn chỉ 1 nút primary. Editor có thanh bước Rà soát → Duyệt → Xuất file, nút chính đổi theo bước.
- Luồng: đăng nhập → 1 màn cấp quyền (đồng ý xử lý dữ liệu + micro tùy chọn, KHÔNG chọn mẫu) → **hướng dẫn sử dụng hiện ngay**
  (`components/Tour.tsx`: làm tối màn hình, khoanh sáng phần tử thật qua `data-tour`, đi qua dashboard + biên bản mẫu, 9 bước,
  Bỏ qua/Esc bất kỳ lúc nào; xem lại ở nút ? cuối sidebar hoặc Cài đặt). Nút "Biên bản mới" ở sidebar; dashboard có khối "Cần bạn xử lý"; xác nhận xong tự nhảy mục kế tiếp;
  banner "AI nhận ra tên người nói → Áp dụng tên"; duyệt xong hỏi xuất file ngay.
- **Biên bản phải tự nhiên** (Quang chê bản cũ "sượng"): câu hoàn chỉnh có chủ ngữ ("Nam báo cáo…"), nội dung thảo luận nhóm theo chủ đề,
  bố cục chuẩn biên bản VN: thông tin chung → 1 Mục đích → 2 Nội dung → 3 Kết luận → 4 Phân công (bảng STT) → 5 Vấn đề theo dõi
  → câu kết thúc → chữ ký Thư ký/Chủ trì. Dùng chung `src/lib/minutesDoc.ts` cho editor, DOCX (Times New Roman 13) và trang in.
  Prompt LLM (`ai/app/providers/llm.py`) có quy tắc văn phong, `topic`, `purpose`, `speaker_names` (gợi ý tên có căn cứ).

## AI service (`ai/`)
Quang chốt (24/10): đưa ý tưởng "2 môi trường ảo tự hủy" vào demo ở mức nhẹ.
- FastAPI, Python 3.12, venv `ai/.venv`. Chạy: `cd ai && .venv/Scripts/python -m uvicorn app.main:app --port 8000`.
  Test: `.venv/Scripts/python -m unittest discover -s tests` (7 test: verify + cô lập hộp).
- Luồng: `POST /jobs` (file + JSON mẫu/từ điển) → thread `_pipeline` (`app/jobs.py`) → hộp 1 `stt_worker` → xóa audio khỏi server
  → hộp 2 `minutes_worker` (chỉ transcript) → `app/verify.py` kiểm tra bằng code → web `GET /jobs/{id}` rồi `DELETE` (ack) để server xóa kết quả; TTL 15'.
- Hộp = `app/sandbox.py`: tiến trình `python -I` riêng + thư mục tạm riêng + env dựng lại chỉ có key của bước đó + timeout; xóa thư mục ngay. Chưa chặn mạng (cần container – để sau MVP).
- Provider chọn trong `ai/.env` (mẫu `.env.example`): STT mock|soniox|deepgram, LLM mock|gemini. Soniox xóa file+transcript trên server họ sau khi lấy; Deepgram gửi `mip_opt_out=true`.
- Mock: `fixtures/mock_meetings.json` export từ `web/src/lib/scenarios.ts` (chạy lại lệnh node import scenarios.ts nếu sửa kịch bản).
- Góp ý đã đưa cho Quang về ý tưởng bảo mật: giá trị thật = cô lập + quyền tối thiểu + không lưu lâu; KHÔNG đúng ở ý "AI không hiểu nội dung"
  (trích quyết định/đầu việc là phải hiểu), và hộp tự hủy không xóa được bản sao ở API bên thứ ba → cần ZDR/gói trả phí hoặc tự host.
- COGS ước tính: Soniox ~$0.12/cuộc 60' (lãi gộp ~50%; trang giá 30/10 ghi async $0.10/giờ), Deepgram ~$0.35 (lỗ ở 15 cuộc/tháng) → nhà cung cấp STT quyết định giá. Khuyến nghị: Soniox + Gemini.

## Video demo
- `demo/VietMinutes-demo.mp4` (quay lại 8/11 với giá CP4; 2:17, có đoạn hướng dẫn, 1440×900, phụ đề tiếng Việt, không có tiếng, dùng giả lập). Quay lại: bật web + AI service rồi
  `python -I demo/record_demo.py <thư mục tạm> demo/sample.wav demo/VietMinutes-demo.mp4` (Playwright + Chrome máy, ffmpeg của imageio_ffmpeg).
- Ảnh flow cho report (3/11, Quang yêu cầu cho đội MKT): `demo/anh-flow/` 21 ảnh đánh số, khung đỏ = chỗ bấm, kèm `00_Flow-su-dung_VietMinutes.docx` + `00_GHI-CHU.txt`.
  Chụp lại: bật web + AI service ở máy (bản Vercel không có AI service → nhật ký bảo mật trống) rồi `python -I demo/capture_flow.py demo/anh-flow demo/sample.wav http://localhost:3000`,
  sau đó `python -I demo/flow_notes.py demo/anh-flow` (lời ghi chú nằm trong file này).
  8/11 đã chụp lại cả 21 ảnh với giá CP4; ảnh 02_bang-gia mới đã lên nhánh `anh-flow-cp4` và thay trong Doc (tab RP Hình 8.2, tab Quang, tab "bản taa") bằng `replaceImage`.

## Bẫy
- Scaffold Next 16 bật `cacheComponents` → build lỗi `usePathname()` ngoài Suspense; đã tắt trong `next.config.ts` (app chạy thuần client).
- Lint React Compiler chặt: không setState trong effect, không đọc ref khi render → dùng `useSyncExternalStore` cho useMounted, `key` để reset state.
- Audio blob không lưu qua reload → trình phát chuyển sang chế độ giả lập đồng hồ.
- Modal phải portal ra body (bị kẹt dưới main khi mở từ sidebar sticky); đổi globals.css mà dev server không nhận → xóa `.next` rồi chạy lại.
- Script Playwright đi qua Tour: thẻ biến mất tạm khi chuyển trang, phải chờ nút "Tiếp"/"Bắt đầu dùng" chứ đừng kiểm tra `count()` ngay.

## Việc tiếp theo
1. Có key Soniox + Gemini và file họp tiếng Việt thật → chạy thật lần đầu, sửa phần đọc kết quả nếu lệch, đánh giá chất lượng.
2. Sửa 2 lỗi ở mục Trạng thái demo.
3. CP4: deck Canva `DAHaTTWG65I` đủ 29 slide (BMC 9 ô dựng bằng khối Canva), báo cáo tab RP, tài chính trên Google Sheet – còn chờ số khảo sát (slide 23–24) và link video demo (slide 28).
