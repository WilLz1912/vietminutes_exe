"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { MeetingStatus } from "@/lib/types";
import { cn, STATUS_LABEL } from "@/lib/utils";

// primary: hành động chính của màn hình (mỗi màn chỉ 1 nút này)
// secondary: hành động phụ; ghost: thao tác nhẹ; danger: xóa; warning: xác nhận mục AI chưa chắc
type Variant = "primary" | "secondary" | "ghost" | "danger" | "warning";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none",
  secondary: "border border-gray-300 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:text-gray-400",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:text-gray-300",
  danger: "bg-seal text-white shadow-sm hover:bg-red-700 disabled:opacity-40",
  warning: "bg-amber-400 text-amber-950 shadow-sm hover:bg-amber-500",
};
const SIZES = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-5 text-[15px]",
};
const base =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <button {...rest} className={cn(base, SIZES[size], VARIANTS[variant], className)} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: keyof typeof SIZES;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, SIZES[size], VARIANTS[variant], className)}>
      {children}
    </Link>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-lg border border-gray-200 bg-white", className)}>{children}</div>;
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 text-[11px] font-medium leading-5", className ?? "bg-gray-100 text-gray-600")}>
      {children}
    </span>
  );
}

const STATUS_STYLE: Record<MeetingStatus, { dot: string; text: string }> = {
  processing: { dot: "bg-brand-500 animate-pulse", text: "text-brand-700" },
  draft: { dot: "bg-amber-400", text: "text-amber-800" },
  approved: { dot: "bg-emerald-500", text: "text-emerald-700" },
  failed: { dot: "bg-red-500", text: "text-red-700" },
};

export function StatusBadge({ status }: { status: MeetingStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", s.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  // portal ra body để không bị kẹt trong stacking context của sidebar/sticky
  return createPortal(
    <div className="no-print fixed inset-0 z-50 flex items-start justify-center bg-gray-900/40 p-4 pt-[12vh]" onMouseDown={onClose}>
      <div
        className={cn("max-h-[80vh] w-full overflow-y-auto rounded-xl bg-white shadow-2xl", wide ? "max-w-2xl" : "max-w-md")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Đóng">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-3">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 pb-5 pt-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight", className)}>
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-[12px] font-bold text-white">VM</span>
      VietMinutes
    </span>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function LaterBadge({ children = "Sau MVP" }: { children?: ReactNode }) {
  return <Badge className="bg-gray-100 text-gray-500">{children}</Badge>;
}

export function PageHeader({ title, meta, actions }: { title: ReactNode; meta?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {meta && <div className="mt-1 text-sm text-gray-500">{meta}</div>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Section({ label, aside, children }: { label: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-b border-gray-200 py-8 md:grid-cols-[240px_1fr]">
      <div>
        <h2 className="text-sm font-semibold">{label}</h2>
        {aside && <div className="mt-1 text-sm text-gray-500">{aside}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
