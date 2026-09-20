"use client";

import { useEffect, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";

/** O'ng tomondan chiqadigan panel (Edu tizimdagi "Jihoz qo'shish" oynasi kabi). */
export function Drawer({
  open,
  onClose,
  title,
  children,
  tone = "default",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** "brand" — Edu tizimdagi "Kirim" panelidek ko'k sarlavha va orqaga o'qi. */
  tone?: "default" | "brand";
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 right-0 flex w-full max-w-md animate-[edu-pop_150ms_var(--ease-edu)] flex-col border-l border-line bg-surface shadow-xl"
      >
        {tone === "brand" ? (
          <div className="flex h-14 shrink-0 items-center gap-3 bg-brand-600 px-5 text-white">
            <button
              type="button"
              onClick={onClose}
              aria-label="Orqaga"
              className="rounded-lg p-1 hover:bg-white/15"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-base font-medium">{title}</h2>
          </div>
        ) : (
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Yopish"
              className="rounded-lg p-1 text-ink-faint hover:bg-canvas hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}
