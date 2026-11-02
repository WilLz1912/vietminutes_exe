"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui";
import { useStore } from "@/lib/store";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const login = useStore((s) => s.login);
  const [loading, setLoading] = useState(false);

  const onGoogle = () => {
    setLoading(true);
    // Giả lập OAuth Google; bản thật dùng Google OAuth 2.0
    setTimeout(() => {
      login();
      router.push(useStore.getState().onboarded ? "/dashboard" : "/onboarding");
    }, 600);
  };

  return (
    <div className="grid flex-1 md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gray-900 p-12 text-gray-200 md:flex">
        <Link href="/" className="text-white">
          <Logo />
        </Link>
        <blockquote className="max-w-md text-2xl leading-snug text-white">
          “Take note không kịp, không thể vừa nghe vừa ghi, dễ miss thông tin.”
          <footer className="mt-4 font-sans text-sm text-gray-400">Chuyên viên kinh doanh, 23 tuổi – phỏng vấn khách hàng, CP2</footer>
        </blockquote>
        <span className="text-xs text-gray-500">EXE101 · Group 1</span>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link href="/" className="md:hidden">
            <Logo />
          </Link>
          <h1 className="mt-8 text-2xl font-semibold tracking-tight md:mt-0">Đăng nhập</h1>
          <p className="mt-2 text-sm text-gray-600">Dùng tài khoản Google công việc. Biên bản và lịch sử cuộc họp chỉ bạn xem được.</p>
          <button
            onClick={onGoogle}
            disabled={loading}
            className="mt-8 flex h-11 w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-60"
          >
            <GoogleIcon />
            {loading ? "Đang kết nối Google…" : "Tiếp tục với Google"}
          </button>
          <p className="mt-6 text-xs leading-relaxed text-gray-500">
            Khi đăng nhập, bạn đồng ý với Điều khoản sử dụng và Chính sách xử lý dữ liệu của VietMinutes.
          </p>
        </div>
      </div>
    </div>
  );
}
