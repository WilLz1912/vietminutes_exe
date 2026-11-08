"""Quay video demo VietMinutes bằng Playwright (con trỏ giả + phụ đề)."""
import os
import shutil
import subprocess
import sys

from playwright.sync_api import sync_playwright

OUT_DIR, WAV, FINAL = sys.argv[1], sys.argv[2], sys.argv[3]
BASE = "http://localhost:3000"
W, H = 1440, 900

OVERLAY = """
(() => {
  const install = () => {
    if (document.getElementById('__cur')) return;
    const c = document.createElement('div');
    c.id = '__cur';
    c.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;width:22px;height:22px;left:-40px;top:-40px;transition:transform .08s';
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l16 10-7 1.5L9.5 21z" fill="#111" stroke="#fff" stroke-width="1.5"/></svg>';
    document.body.appendChild(c);
    const cap = document.createElement('div');
    cap.id = '__cap';
    cap.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;left:50%;bottom:28px;transform:translateX(-50%);max-width:900px;padding:10px 18px;border-radius:10px;background:rgba(15,23,42,.88);color:#fff;font:500 17px Inter,system-ui,sans-serif;text-align:center;opacity:0;transition:opacity .3s';
    document.body.appendChild(cap);
    const saved = sessionStorage.getItem('__capText');
    if (saved) { cap.textContent = saved; cap.style.opacity = 1; }
    document.addEventListener('mousemove', e => { c.style.left = e.clientX - 3 + 'px'; c.style.top = e.clientY - 2 + 'px'; }, true);
    document.addEventListener('mousedown', () => c.style.transform = 'scale(.8)', true);
    document.addEventListener('mouseup', () => c.style.transform = 'scale(1)', true);
  };
  window.__caption = (t) => {
    sessionStorage.setItem('__capText', t || '');
    const cap = document.getElementById('__cap');
    if (!cap) return;
    cap.textContent = t || '';
    cap.style.opacity = t ? 1 : 0;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    ctx = b.new_context(viewport={"width": W, "height": H}, record_video_dir=OUT_DIR, record_video_size={"width": W, "height": H}, accept_downloads=True)
    ctx.add_init_script(OVERLAY)
    pg = ctx.new_page()
    pos = {"x": W / 2, "y": H / 2}

    def wait(ms):
        pg.wait_for_timeout(ms)

    def cap(text, ms=0):
        pg.evaluate("t => window.__caption && window.__caption(t)", text)
        if ms:
            wait(ms)

    def move_to(loc):
        loc.scroll_into_view_if_needed()
        box = loc.bounding_box()
        x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        pg.mouse.move(pos["x"], pos["y"])
        pg.mouse.move(x, y, steps=28)
        pos.update(x=x, y=y)
        wait(250)

    def click(loc, after=700):
        move_to(loc)
        loc.click()
        wait(after)

    def scroll(dy, steps=12, ms=60):
        for _ in range(steps):
            pg.mouse.wheel(0, dy / steps)
            wait(ms)

    btn = lambda name, **kw: pg.get_by_role("button", name=name, **kw)

    # 1. Landing
    pg.goto(BASE)
    wait(1200)
    cap("VietMinutes – trợ lý AI tạo biên bản họp tiếng Việt", 2500)
    cap("Mỗi kết luận, đầu việc dẫn về câu gốc; chỗ AI chưa chắc được đánh dấu để bạn xác nhận", 2500)
    scroll(900, 18)
    cap("So sánh với công cụ ghi chú AI thông thường", 2000)
    scroll(700, 14)
    cap("Bảo mật: mỗi cuộc họp xử lý trong hộp riêng, hộp bị hủy ngay khi có kết quả", 2500)
    scroll(700, 14)
    cap("Bảng giá: Free 3 biên bản/tháng · Premium 199.000đ/tháng hoặc 1.590.000đ năm đầu", 2500)
    pg.mouse.wheel(0, -5000)
    wait(800)

    # 2. Đăng nhập + thiết lập
    cap("Bắt đầu: đăng nhập bằng Google")
    click(pg.get_by_role("link", name="Dùng miễn phí"), 900)
    click(btn("Tiếp tục với Google"), 1400)
    cap("Cấp quyền cơ bản: đồng ý xử lý dữ liệu, micro không bắt buộc", 1200)
    click(btn("Đồng ý tất cả"), 600)
    click(btn("Tiếp tục"), 1500)
    cap("Ngay sau đó là hướng dẫn sử dụng trực quan trên biên bản mẫu – có thể bỏ qua", 1500)
    click(btn("Xem hướng dẫn"), 2600)
    while btn("Tiếp", exact=True).count():
        click(btn("Tiếp", exact=True), 2800)
    click(btn("Bắt đầu dùng"), 1200)

    # 3. Tạo biên bản
    cap("Trang cuộc họp: khối “Cần bạn xử lý” cho biết việc tiếp theo", 2500)
    cap("Tải file ghi âm cuộc họp (hoặc kéo-thả, hoặc thu âm trực tiếp)")
    move_to(btn("Tải file ghi âm").first)
    with pg.expect_file_chooser() as fc:
        btn("Tải file ghi âm").first.click()
    fc.value.set_files(WAV)
    wait(1200)
    cap("Đặt tên cuộc họp và chọn mẫu biên bản", 1500)
    click(pg.get_by_label("Tên cuộc họp"), 300)
    pg.keyboard.press("Control+A")
    pg.keyboard.type("Sprint Planning #14 – App Giao Hàng", delay=35)
    wait(600)
    click(btn("Bắt đầu xử lý"), 300)

    # 4. Xử lý
    cap("Hộp 1 chép lời, hộp 2 viết biên bản, rồi code kiểm tra từng mục với câu gốc", 2500)
    pg.wait_for_selector("text=Mục đích cuộc họp", timeout=30000)
    wait(800)
    cap("Biên bản đã sẵn sàng: bên trái là transcript, bên phải là biên bản", 3000)

    # 5. Rà soát
    cap("AI nhận ra tên người nói từ nội dung – bấm Áp dụng tên")
    click(btn("Áp dụng tên"), 1500)
    cap("Đọc biên bản: câu hoàn chỉnh, nhóm theo chủ đề như thư ký viết", 1000)
    doc = pg.locator("article").first
    move_to(doc)
    for _ in range(3):
        scroll(350, 10, 70)
        wait(500)
    cap("Bước 1 – Rà soát: chỉ cần kiểm tra những chỗ AI chưa chắc (nền vàng)")
    click(btn("Xem mục cần xác nhận"), 1500)
    cap("Nghe lại đúng câu gốc trong cuộc họp…")
    click(btn("Nghe câu gốc").first, 2200)
    cap("…rồi bấm “Đúng, xác nhận”. Hệ thống tự chuyển sang chỗ tiếp theo")
    while btn("Đúng, xác nhận").count():
        click(btn("Đúng, xác nhận").first, 1600)
    cap("Bước 2 – Duyệt: biên bản được khóa nội dung", 1200)
    click(btn("Duyệt biên bản"), 1500)
    cap("Bước 3 – Xuất file Word đúng mẫu để gửi cho team")
    with pg.expect_download() as d:
        click(btn("Tải Word").last, 300)
    d.value.save_as(os.path.join(OUT_DIR, "bien-ban-demo.docx"))
    wait(1500)
    cap("Nhật ký xử lý & bảo mật: hộp nào được tạo, hủy lúc nào, audio xóa lúc nào")
    click(pg.locator("button[title='Nhật ký xử lý & bảo mật']"), 3500)
    pg.keyboard.press("Escape")
    wait(600)

    # 6. Google Meet extension
    cap("Họp trên Google Meet: ghi âm bằng Chrome Extension, không cần mời bot")
    click(pg.get_by_role("link", name="Google Meet"), 1200)
    click(btn("Thêm vào Chrome"), 800)
    click(btn("Đăng nhập với Google"), 800)
    click(btn("● Record"), 3500)
    click(btn("Stop"), 2500)
    cap("Ghi xong, file tự tải lên và AI tạo biên bản")
    click(pg.get_by_role("link", name="Mở biên bản trên Web"), 2500)
    pg.wait_for_selector("text=Mục đích cuộc họp", timeout=30000)
    wait(1500)

    # 7. Kết
    click(pg.get_by_role("link", name="Cuộc họp").first, 1200)
    cap("VietMinutes – họp xong là có biên bản, bạn chỉ cần duyệt", 3500)
    cap("", 500)

    video = pg.video.path()
    ctx.close()
    b.close()

ff = r"C:\Users\Quang\AppData\Local\Programs\Python\Python312\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe"
os.makedirs(os.path.dirname(os.path.abspath(FINAL)), exist_ok=True)
subprocess.run([ff, "-y", "-loglevel", "error", "-i", video, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", FINAL], check=True)
print("video:", FINAL, os.path.getsize(FINAL) // 1024, "KB")
