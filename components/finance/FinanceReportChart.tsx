import { Card, CardHeader, EmptyState } from "@/components/ui/Card";
import { formatSom } from "@/lib/utils/currency";
import { MONTH_NAMES } from "@/lib/utils/date";

export interface FinanceMonthRow {
  period: string;
  income: number;
  expenses: number;
  salaries: number;
}

export function FinanceReportChart({ months }: { months: FinanceMonthRow[] }) {
  const max = Math.max(
    1,
    ...months.map((m) => Math.max(Number(m.income), Number(m.expenses) + Number(m.salaries))),
  );

  return (
    <Card>
      <CardHeader title="Oylar kesimida tushum va xarajat" />
      <div className="p-4">
        {months.length === 0 ? (
          <EmptyState
            title="Ma'lumot yo'q"
            hint="To'lovlar va xarajatlar kiritilgach, bu yerda oylik grafik chiziladi."
          />
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-brand-500" /> Tushum
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400" /> Xarajat
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> Oyliklar
              </span>
            </div>

            <div className="flex h-48 items-end gap-3 overflow-x-auto">
              {months.map((m) => {
                const [, monthNum] = m.period.split("-");
                const label = MONTH_NAMES[Number(monthNum) - 1]?.slice(0, 3) ?? m.period;
                return (
                  <div key={m.period} className="flex w-16 flex-none flex-col items-center gap-2">
                    <div className="flex h-40 w-full items-end justify-center gap-1">
                      <div
                        className="w-1/3 rounded-t bg-brand-500"
                        style={{ height: `${(Number(m.income) / max) * 100}%` }}
                        title={`Tushum: ${formatSom(Number(m.income))}`}
                      />
                      <div
                        className="w-1/3 rounded-t bg-red-400"
                        style={{ height: `${(Number(m.expenses) / max) * 100}%` }}
                        title={`Xarajat: ${formatSom(Number(m.expenses))}`}
                      />
                      <div
                        className="w-1/3 rounded-t bg-amber-400"
                        style={{ height: `${(Number(m.salaries) / max) * 100}%` }}
                        title={`Oyliklar: ${formatSom(Number(m.salaries))}`}
                      />
                    </div>
                    <span className="text-[11px] text-ink-faint">{label}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
