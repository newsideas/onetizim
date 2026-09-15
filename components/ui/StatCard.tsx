import type { LucideIcon } from "lucide-react";

type Accent = "brand" | "red" | "green" | "amber" | "blue";

const accentClasses: Record<Accent, string> = {
  brand: "bg-brand-50 text-brand-600",
  red: "bg-red-50 text-red-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "brand",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: Accent;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2.5 ${accentClasses[accent]}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm text-ink-muted">{label}</div>
          <div className="truncate text-xl font-semibold text-ink">{value}</div>
          {hint && <div className="mt-0.5 text-xs text-ink-faint">{hint}</div>}
        </div>
      </div>
    </div>
  );
}
