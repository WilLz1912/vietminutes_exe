"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/utils";

type Kind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: Kind;
  text: string;
}

const useToasts = create<{ items: Toast[]; push: (kind: Kind, text: string) => void }>((set) => ({
  items: [],
  push: (kind, text) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { id, kind, text }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), 3200);
  },
}));

export const toast = {
  success: (t: string) => useToasts.getState().push("success", t),
  error: (t: string) => useToasts.getState().push("error", t),
  info: (t: string) => useToasts.getState().push("info", t),
};

export function Toaster() {
  const items = useToasts((s) => s.items);
  return (
    <div className="no-print pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex max-w-sm items-start gap-2 border-l-4 bg-brand-700 px-4 py-3 text-sm text-white shadow-lg",
            t.kind === "error" && "border-red-500",
            t.kind === "success" && "border-emerald-400",
            t.kind === "info" && "border-gray-400",
          )}
        >
          {t.kind === "success" && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />}
          {t.kind === "error" && <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />}
          {t.kind === "info" && <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}
