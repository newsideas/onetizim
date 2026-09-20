import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { ReportCards } from "@/components/reports/ReportParts";
import { formatSom } from "@/lib/utils/currency";
import { MONTH_NAMES, monthStartIso, parseMonth, todayIso } from "@/lib/utils/date";

const WEEKDAYS = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];

/** ?month=2026-09 — oy o'zgartirish uchun qo'shni oy (YYYY-MM). */
function shiftMonth(period: string, delta: number): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** Moliya analitikasi: oy kalendari — har kunning tushumi. */
export default async function FinanceAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const { supabase } = await requirePermission("finance.reports");

  const start = parseMonth(month ?? monthStartIso().slice(0, 7));
  const ym = start.slice(0, 7);
  const [year, monthNum] = ym.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
  const end = `${ym}-${String(daysInMonth).padStart(2, "0")}`;

  const { data } = await supabase
    .from("payments")
    .select("amount, paid_at")
    .gte("paid_at", start)
    .lte("paid_at", end);

  const byDay = new Map<number, number>();
  for (const p of (data ?? []) as { amount: number; paid_at: string }[]) {
    const day = Number(p.paid_at.slice(8, 10));
    byDay.set(day, (byDay.get(day) ?? 0) + Number(p.amount));
  }
  const total = [...byDay.values()].reduce((s, v) => s + v, 0);
  const best = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];

  // Oyning 1-kuni haftaning qaysi kuniga to'g'ri kelishi (Dushanba = 0).
  const offset = (new Date(Date.UTC(year, monthNum - 1, 1)).getUTCDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const today = todayIso();

  const nav =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-ink-muted hover:bg-canvas";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href={`/finance/analytics?month=${shiftMonth(ym, -1)}`} className={nav} aria-label="Oldingi oy">
          <ChevronLeft size={16} />
        </Link>
        <h1 className="min-w-40 text-center text-base font-semibold text-ink">
          {MONTH_NAMES[monthNum - 1]} {year}
        </h1>
        <Link href={`/finance/analytics?month=${shiftMonth(ym, 1)}`} className={nav} aria-label="Keyingi oy">
          <ChevronRight size={16} />
        </Link>
      </div>

      <ReportCards
        items={[
          { label: "Oylik tushum", value: formatSom(total), tone: "good" },
          { label: "O'rtacha kunlik", value: formatSom(Math.round(total / daysInMonth)) },
          {
            label: "Eng yaxshi kun",
            value: best ? `${best[0]}-kun · ${formatSom(best[1])}` : "—",
          },
          { label: "To'lovlar soni", value: `${(data ?? []).length} ta` },
        ]}
      />

      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="grid grid-cols-7 border-b border-line bg-canvas text-center text-xs font-semibold text-ink-muted">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const sum = day ? (byDay.get(day) ?? 0) : 0;
            const isToday = day !== null && `${ym}-${String(day).padStart(2, "0")}` === today;
            return (
              <div
                key={i}
                className={`min-h-20 border-r border-b border-line p-2 text-xs ${
                  day ? "" : "bg-canvas/50"
                }`}
              >
                {day && (
                  <>
                    <div
                      className={
                        isToday
                          ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white"
                          : "text-ink-muted"
                      }
                    >
                      {day}
                    </div>
                    <div className={`mt-1 font-medium ${sum > 0 ? "text-green-600" : "text-ink-faint"}`}>
                      {formatSom(sum)}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
