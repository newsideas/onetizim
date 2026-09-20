import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";
import { MonthlyGrid, YearSwitcher, type GridRow } from "@/components/reports/MonthlyGrid";
import { ExportCsvButton } from "@/components/reports/ExportCsvButton";
import { METHOD_LABELS, MONTH_LABELS, loadYearFlows, parseYear, sumOf, sumRows } from "@/lib/finance-monthly";

/** Moliya hisobotlari (P&L): daromad, xarajat va sof foyda — kategoriya × 12 oy (Edu tizimdagidek). */
export default async function PnlPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const params = await searchParams;
  const year = parseYear(params.year);
  const { supabase } = await requirePermission("finance.reports");
  const flows = await loadYearFlows(supabase, year);

  const byTotalDesc = (a: [string, number[]], b: [string, number[]]) => sumOf(b[1]) - sumOf(a[1]);
  const incomeRows = [...flows.income.entries()].sort(byTotalDesc);
  const expenseRows = [...flows.expense.entries()].sort(byTotalDesc);

  const income = sumRows(incomeRows.map(([, v]) => v));
  const expense = sumRows(expenseRows.map(([, v]) => v));
  const profit = income.map((v, i) => v - expense[i]);

  const rows: GridRow[] = [
    { label: "Daromad", style: "section" },
    ...incomeRows.map(([key, values]): GridRow => ({ label: METHOD_LABELS[key] ?? key, values, style: "sub" })),
    { label: "Jami daromad", values: income, style: "total" },
    { label: "Xarajat", style: "section" },
    ...expenseRows.map(([key, values]): GridRow => ({ label: key, values, style: "sub" })),
    { label: "Jami xarajat", values: expense, style: "total" },
    { label: "Sof foyda", values: profit, style: "net" },
  ];

  const csvRows = rows
    .filter((r) => r.values)
    .map((r) => [r.label, ...(r.values as number[]).map(Math.round), Math.round(sumOf(r.values as number[]))]);

  return (
    <ListPageShell
      title="Moliya hisobotlari (P&L)"
      subtitle={`${year}-yil bo'yicha daromad, xarajat va sof foyda (so'm)`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <YearSwitcher basePath="/finance/pnl" year={year} />
          <ExportCsvButton filename={`pnl-${year}.csv`} header={["Kategoriya", ...MONTH_LABELS, "Jami"]} rows={csvRows} />
        </div>
      }
      notice={
        flows.missing
          ? "Hisobot funksiyasi bazada topilmadi — 0068 migratsiyasini Supabase SQL Editor'da ishga tushiring."
          : undefined
      }
    >
      <MonthlyGrid rows={rows} withTotal />
    </ListPageShell>
  );
}
