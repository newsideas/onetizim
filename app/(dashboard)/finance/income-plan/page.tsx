import { requirePermission } from "@/lib/auth/session";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { formatSom } from "@/lib/utils/currency";
import { formatDate, monthStartIso, todayIso } from "@/lib/utils/date";

/**
 * Tushum rejasi: joriy oy uchun hisoblangan to'lovlar, shu oyda tushgan summa
 * va hali kutilayotgan tushum; hozirgi qarzdorlar hisobga olinadi.
 */
export default async function IncomePlanPage() {
  const { supabase } = await requirePermission("finance.reports");
  const monthStart = monthStartIso();

  const [chargesRes, paymentsRes, studentsRes] = await Promise.all([
    supabase.from("charges").select("amount").eq("period", monthStart),
    supabase.from("payments").select("amount").gte("paid_at", monthStart),
    supabase.from("students").select("balance").eq("status", "active"),
  ]);

  const charged = (chargesRes.data ?? []).reduce((s, c) => s + Number(c.amount), 0);
  const paidThisMonth = (paymentsRes.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const balances = (studentsRes.data ?? []).map((s) => Number(s.balance));
  const debtors = balances.filter((b) => b < 0);
  const totalDebt = debtors.reduce((s, b) => s - b, 0);
  const remaining = Math.max(0, charged - paidThisMonth);
  // Eski oydan o'tgan qarz: umumiy qarzdan shu oyning to'lanmagan qismi ayriladi.
  const oldDebt = Math.max(0, totalDebt - remaining);

  const rows = [
    { name: `Tushum rejasi (${formatDate(todayIso())})`, count: balances.length, sum: charged },
    { name: "Eski oydan qarzdor bo'lib o'tgan o'quvchilar summasi", count: debtors.length, sum: oldDebt },
    { name: "Shu oyda to'lagan summa", count: null, sum: paidThisMonth },
    { name: "Qolgan kutilayotgan tushum", count: null, sum: remaining },
  ];

  return (
    <div className="space-y-4">
      <ReportCards
        items={[
          { label: "Shu oy hisoblangan", value: formatSom(charged) },
          { label: "Shu oyda to'langan", value: formatSom(paidThisMonth), tone: "good" },
          { label: "Kutilayotgan tushum", value: formatSom(remaining), tone: remaining > 0 ? "bad" : "default" },
          { label: "Jami qarzdorlik", value: formatSom(totalDebt), tone: totalDebt > 0 ? "bad" : "default" },
        ]}
      />
      <ReportTable
        rows={rows}
        rowKey={(r) => r.name}
        columns={[
          { header: "Tushum rejasi", cell: (r) => <span className="text-ink">{r.name}</span> },
          { header: "O'quvchi soni", cell: (r) => (r.count === null ? "—" : r.count) },
          { header: "Umumiy kutilayotgan summa", align: "right", cell: (r) => formatSom(r.sum) },
        ]}
      />
    </div>
  );
}
