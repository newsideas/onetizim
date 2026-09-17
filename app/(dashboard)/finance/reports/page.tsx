import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";
import { StatCard } from "@/components/ui/StatCard";
import { FinanceReportChart, type FinanceMonthRow } from "@/components/finance/FinanceReportChart";
import { formatSom } from "@/lib/utils/currency";
import { monthsAgo, monthStartIso } from "@/lib/utils/date";

export default async function FinanceReportsPage() {
  const { supabase } = await requirePermission("finance.reports");

  const from = monthsAgo(5);
  const to = monthStartIso();

  const [{ data: months, error }, { data: balance }] = await Promise.all([
    supabase.rpc("finance_monthly", { p_from: from, p_to: to }),
    supabase.rpc("cash_balance_by_method"),
  ]);

  const rows = (months ?? []) as FinanceMonthRow[];
  const totalIncome = rows.reduce((sum, m) => sum + Number(m.income), 0);
  const totalExpenses = rows.reduce((sum, m) => sum + Number(m.expenses), 0);
  const totalSalaries = rows.reduce((sum, m) => sum + Number(m.salaries), 0);
  const netProfit = totalIncome - totalExpenses - totalSalaries;

  const cashBalance = ((balance ?? []) as { income: number; outcome: number }[]).reduce(
    (sum, r) => sum + Number(r.income) - Number(r.outcome),
    0,
  );

  return (
    <ListPageShell
      title="Balans va hisobot"
      subtitle="So'nggi 6 oy — tushum, xarajat va sof natija"
      notice={
        error
          ? "Hisobot funksiyalari bazada topilmadi — 0024_finance.sql va 0025_finance_reports.sql migratsiyalarini Supabase SQL Editor'da ishga tushiring."
          : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tushum (6 oy)" value={formatSom(totalIncome)} icon={TrendingUp} accent="green" />
        <StatCard
          label="Xarajat + oylik (6 oy)"
          value={formatSom(totalExpenses + totalSalaries)}
          icon={TrendingDown}
          accent="red"
        />
        <StatCard
          label="Sof natija (6 oy)"
          value={formatSom(netProfit)}
          icon={netProfit >= 0 ? TrendingUp : TrendingDown}
          accent={netProfit >= 0 ? "brand" : "red"}
        />
        <StatCard label="Kassa qoldig'i" value={formatSom(cashBalance)} icon={Wallet} accent="blue" />
      </div>

      <FinanceReportChart months={rows} />
    </ListPageShell>
  );
}
