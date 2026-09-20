import Link from "next/link";
import { MONTH_LABELS } from "@/lib/finance-monthly";

export type GridRowStyle = "section" | "sub" | "row" | "total" | "net";

export interface GridRow {
  label: string;
  /** 12 oylik qiymatlar; berilmasa qator faqat sarlavha (bo'lim nomi). */
  values?: number[];
  style?: GridRowStyle;
}

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(Math.round(n));

/** Oylik jadval (Edu tizimdagi P&L va Pul oqimi ko'rinishi): kategoriya × 12 oy, ixtiyoriy "Jami" ustuni. */
export function MonthlyGrid({ rows, withTotal = false }: { rows: GridRow[]; withTotal?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-canvas">
          <tr>
            <th className="sticky left-0 z-10 min-w-56 bg-canvas px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
              Kategoriya
            </th>
            {MONTH_LABELS.map((m) => (
              <th key={m} className="px-3 py-3 text-right text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase">
                {m}
              </th>
            ))}
            {withTotal && (
              <th className="px-3 py-3 text-right text-xs font-semibold tracking-wide whitespace-nowrap text-ink-muted uppercase">
                Jami
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, index) => {
            const style = row.style ?? "row";
            if (!row.values) {
              return (
                <tr key={index} className="bg-canvas/60">
                  <td colSpan={MONTH_LABELS.length + 1 + (withTotal ? 1 : 0)} className="px-4 py-2 text-xs font-semibold tracking-wide text-ink uppercase">
                    {row.label}
                  </td>
                </tr>
              );
            }
            const total = row.values.reduce((a, b) => a + b, 0);
            const strong = style === "total" || style === "net";
            return (
              <tr key={index} className={strong ? "bg-canvas/40 font-semibold" : ""}>
                <td
                  className={`sticky left-0 z-10 bg-surface px-4 py-2 whitespace-nowrap ${
                    style === "sub" ? "pl-8 text-ink-muted" : "text-ink"
                  } ${strong ? "bg-canvas/40 font-semibold" : ""}`}
                >
                  {row.label}
                </td>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className={`px-3 py-2 text-right whitespace-nowrap tabular-nums ${
                      v < 0 ? "text-red-600" : v === 0 ? "text-ink-faint" : "text-ink"
                    }`}
                  >
                    {fmt(v)}
                  </td>
                ))}
                {withTotal && (
                  <td className={`px-3 py-2 text-right whitespace-nowrap tabular-nums font-semibold ${total < 0 ? "text-red-600" : "text-ink"}`}>
                    {fmt(total)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Yil almashtirgich: oldingi/keyingi yil havolalari. */
export function YearSwitcher({ basePath, year }: { basePath: string; year: number }) {
  const link = "rounded-lg border border-line px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink";
  return (
    <div className="flex items-center gap-2">
      <Link href={`${basePath}?year=${year - 1}`} className={link} aria-label="Oldingi yil">
        ‹ {year - 1}
      </Link>
      <span className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white">{year}</span>
      <Link href={`${basePath}?year=${year + 1}`} className={link} aria-label="Keyingi yil">
        {year + 1} ›
      </Link>
    </div>
  );
}
