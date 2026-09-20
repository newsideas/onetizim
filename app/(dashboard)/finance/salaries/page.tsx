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

  // Oy chegarasi: bonus va jarimalar shu oy ichida berilganlari hisoblanadi.
  const [year, month] = period.split("-").map(Number);
  const nextPeriod = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);

  const [{ data, error }, { data: payouts }, { data: bonuses }, { data: fines }] = await Promise.all([
    supabase.rpc("salary_calculation", { p_period: period }),
    supabase
      .from("salary_payouts")
      .select("id, amount, method, paid_at, note, employee_id, employee:teachers(full_name)")
      .eq("period", period)
      .order("paid_at", { ascending: false }),
    supabase.from("staff_bonuses").select("employee_id, amount").gte("given_on", period).lt("given_on", nextPeriod),
    supabase.from("staff_fines").select("employee_id, amount").gte("given_on", period).lt("given_on", nextPeriod),
  ]);

  const sumBy = (rows: { employee_id: string | null; amount: number }[] | null) => {
    const totals = new Map<string, number>();
    for (const r of rows ?? []) {
      if (r.employee_id) totals.set(r.employee_id, (totals.get(r.employee_id) ?? 0) + Number(r.amount));
    }
    return totals;
  };
  const bonusByEmployee = sumBy(bonuses);
  const fineByEmployee = sumBy(fines);

  // Oxirgi to'lov sanasi (to'lovlar sanasi bo'yicha kamayish tartibida keladi).
  const lastPaidByEmployee = new Map<string, string>();
  for (const p of (payouts ?? []) as unknown as { employee_id: string; paid_at: string }[]) {
    if (!lastPaidByEmployee.has(p.employee_id)) lastPaidByEmployee.set(p.employee_id, p.paid_at);
  }

  const rows = ((data ?? []) as SalaryRow[]).map((r) => ({
    ...r,
    bonus: bonusByEmployee.get(r.employee_id) ?? 0,
    fine: fineByEmployee.get(r.employee_id) ?? 0,
    lastPaidAt: lastPaidByEmployee.get(r.employee_id) ?? null,
  }));

  return (
    <ListPageShell
      title="Xodimlar maoshi"
      subtitle={`${formatMonth(period)} uchun hisob-kitob`}
      actions={<MonthPicker value={period} />}
      notice={
        error
          ? "Oylik hisoblash funksiyasi bazada topilmadi — 0024_finance.sql va 0026_salary_calculation.sql migratsiyalarini Supabase SQL Editor&apos;da ishga tushiring."
          : undefined
      }
    >
      <SalaryTable rows={rows} period={period} />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ink-muted">Shu oy uchun to&apos;lovlar</h2>
        <SalaryPayoutsList payouts={(payouts ?? []) as unknown as SalaryPayoutRow[]} />
      </div>
    </ListPageShell>
  );
}
