import { requirePermission } from "@/lib/auth/session";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { formatSom } from "@/lib/utils/currency";

interface ContractRow {
  discount_amount: number;
  student: { id: string; full_name: string; group: { name: string; subject: string | null } | null } | null;
}

/** Umumiy chegirmalar: faol shartnomalar bo'yicha har bir o'quvchi olgan chegirma summasi (Edu tizimdagidek). */
export default async function DiscountsReportPage() {
  const { supabase } = await requirePermission("finance.reports");

  const { data } = await supabase
    .from("contracts")
    .select("discount_amount, student:students(id, full_name, group:groups(name, subject))")
    .eq("status", "active")
    .gt("discount_amount", 0)
    .limit(5000);
  const contracts = (data ?? []) as unknown as ContractRow[];

  const byStudent = new Map<string, { name: string; course: string; group: string; sum: number }>();
  for (const c of contracts) {
    if (!c.student) continue;
    const cur = byStudent.get(c.student.id) ?? {
      name: c.student.full_name,
      course: c.student.group?.subject ?? "—",
      group: c.student.group?.name ?? "—",
      sum: 0,
    };
    cur.sum += Number(c.discount_amount);
    byStudent.set(c.student.id, cur);
  }
  const rows = [...byStudent.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.sum - a.sum);
  const total = rows.reduce((s, r) => s + r.sum, 0);

  return (
    <div className="space-y-4">
      <ReportCards
        items={[
          { label: "Umumiy chegirmalar", value: formatSom(total), tone: "bad" },
          { label: "Chegirmali o'quvchilar", value: rows.length },
          { label: "Chegirmali shartnomalar", value: contracts.length },
        ]}
      />
      <ReportTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { header: "Ism", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
          { header: "Kurs", cell: (r) => r.course },
          { header: "Guruh", cell: (r) => r.group },
          { header: "Umumiy olgan chegirmasi", align: "right", cell: (r) => formatSom(r.sum) },
        ]}
      />
    </div>
  );
}
