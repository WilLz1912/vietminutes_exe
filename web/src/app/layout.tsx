import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { Toaster } from "@/components/Toaster";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});
const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "VietMinutes – Biên bản họp tiếng Việt",
  description: "Trợ lý AI tạo biên bản họp tiếng Việt, có dẫn chiếu câu gốc và được bạn xác nhận trước khi gửi.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
