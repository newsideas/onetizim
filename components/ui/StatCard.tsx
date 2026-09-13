import type { LucideIcon } from "lucide-react";

type Accent = "blue" | "red" | "green" | "amber";

const accentClasses: Record<Accent, string> = {
  blue: "bg-blue-500/10 text-blue-400",
  red: "bg-red-500/10 text-red-400",
  green: "bg-green-500/10 text-green-400",
  amber: "bg-amber-500/10 text-amber-400",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: Accent;
}) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${accentClasses[accent]}`}>
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm text-white/50">{label}</div>
          <div className="truncate text-xl font-semibold text-white">{value}</div>
        </div>
      </div>
    </div>
  );
}
