import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Accent = "brand" | "red" | "green" | "amber" | "blue" | "purple" | "dark" | "gray";

/** Edu tizimdagi rangli kvadrat ikonkalar (to'liq rangli fon, oq ikonka). */
const accentClasses: Record<Accent, string> = {
  brand: "bg-brand-600",
  red: "bg-[#e5484d]",
  green: "bg-[#00d66f]",
  amber: "bg-[#ffc107]",
  blue: "bg-[#0ea5e9]",
  purple: "bg-[#a855f7]",
  dark: "bg-[#1a1a1a]",
  gray: "bg-[#b4b4b4]",
};

const CARD =
  "flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow duration-300 ease-(--ease-edu) hover:shadow-md";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "brand",
  hint,
  href,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: Accent;
  hint?: string;
  /** Berilsa karta bosilganda tegishli ro'yxatga olib boradi. */
  href?: string;
}) {
  const content = (
    <>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${accentClasses[accent]}`}
      >
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="text-xs leading-tight text-ink">{label}</div>
        <div className="truncate text-lg leading-tight font-bold text-ink">{value}</div>
        {hint && <div className="mt-0.5 truncate text-[11px] text-ink-faint">{hint}</div>}
      </div>
    </>
  );

  return href ? (
    <Link href={href} className={CARD}>
      {content}
    </Link>
  ) : (
    <div className={CARD}>{content}</div>
  );
}
