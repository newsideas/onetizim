import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";
import { MonthPicker } from "@/components/finance/MonthPicker";
import { SalaryTable, type SalaryRow } from "@/components/finance/SalaryTable";
import { SalaryPayoutsList, type SalaryPayoutRow } from "@/components/finance/SalaryPayoutsList";
import { parseMonth, formatMonth } from "@/lib/utils/date";

export default async function SalariesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const period = parseMonth(params.month);
  const { supabase } = await requirePermission("salaries.manage");

  const [{ data, error }, { data: payouts }] = await Promise.all([
    supabase.rpc("salary_calculation", { p_period: period }),
    supabase
      .from("salary_payouts")
      .select("id, amount, method, paid_at, note, employee:teachers(full_name)")
      .eq("period", period)
      .order("paid_at", { ascending: false }),
  ]);

  return (
    <ListPageShell
      title="Xodimlar maoshi"
      subtitle={`${formatMonth(period)} uchun hisob-kitob`}
      actions={<MonthPicker value={period} />}
      notice={
        error
          ? "Oylik hisoblash funksiyasi bazada topilmadi — 0024_finance.sql va 0026_salary_calculation.sql migratsiyalarini Supabase SQL Editor'da ishga tushiring."
          : undefined
      }
    >
      <SalaryTable rows={(data ?? []) as SalaryRow[]} period={period} />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ink-muted">Shu oy uchun to&apos;lovlar</h2>
        <SalaryPayoutsList payouts={(payouts ?? []) as unknown as SalaryPayoutRow[]} />
      </div>
    </ListPageShell>
  );
}
