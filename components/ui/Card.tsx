import type { ReactNode } from "react";

/** Oq karta — barcha bloklar shu ustiga quriladi. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Karta sarlavhasi — My School uslubidagi kichik bosh harfli yozuv. */
export function CardHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-3">
      <h2 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
        {title}
      </h2>
      {action}
    </div>
  );
}

/** Ma'lumot yo'q holati — foydalanuvchiga nima ko'rinishini tushuntiradi. */
export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm font-medium text-ink-muted">{title}</p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}
