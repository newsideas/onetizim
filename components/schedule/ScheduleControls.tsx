import Link from "next/link";
import { CalendarDays, LayoutGrid } from "lucide-react";
import { HAFTA_KUNLARI } from "@/lib/utils/date";

export type ScheduleView = "week" | "day";

/** Hafta / kun ko'rinishi o'rtasida almashtirish. */
export function ScheduleViewToggle({
  view,
  day,
}: {
  view: ScheduleView;
  day: string;
}) {
  const options: {
    value: ScheduleView;
    label: string;
    icon: typeof CalendarDays;
  }[] = [
    { value: "week", label: "Hafta", icon: LayoutGrid },
    { value: "day", label: "Kun / xonalar", icon: CalendarDays },
  ];

  return (
    <div className="flex gap-2">
      {options.map((o) => {
        const Icon = o.icon;
        const href =
          o.value === "week"
            ? "/education/class-schedule"
            : `/education/class-schedule?view=day&day=${encodeURIComponent(day)}`;

        return (
          <Link
            key={o.value}
            href={href}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              view === o.value
                ? "bg-brand-600 text-white"
                : "bg-canvas text-ink-muted hover:bg-line"
            }`}
          >
            <Icon size={14} />
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

/** Kunlik ko'rinish uchun hafta kunlari tanlovi. */
export function DayPicker({ current }: { current: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {HAFTA_KUNLARI.map((d) => (
        <Link
          key={d}
          href={`/education/class-schedule?view=day&day=${encodeURIComponent(d)}`}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            current === d
              ? "bg-brand-600 text-white"
              : "bg-canvas text-ink-muted hover:bg-line"
          }`}
        >
          {d}
        </Link>
      ))}
    </div>
  );
}
