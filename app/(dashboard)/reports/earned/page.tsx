import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { formatSom } from "@/lib/utils/currency";
import { monthStartIso, todayIso } from "@/lib/utils/date";

interface PaymentRow {
  amount: number;
  student: { group: { name: string; teacher: { full_name: string } | null } | null } | null;
}

const NO_TEACHER = "O'qituvchi biriktirilmagan";

/**
 * O'quv markazga ishlab berilgan pul (Edu tizimdagi o'qituvchilar analitikasi): tanlangan davrdagi
 * to'lovlar o'quvchining guruhi orqali shu guruh o'qituvchisiga nisbatlanadi.
 */
export default async function EarnedByTeacherPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("finance.reports");

  const from = params.from || monthStartIso();
  const to = params.to || todayIso();

  const { data } = await supabase
    .from("payments")
    .select("amount, student:students(group:groups(name, teacher:teachers(full_name)))")
    .gte("paid_at", from)
    .lte("paid_at", to)
    .limit(5000);
  const payments = (data ?? []) as unknown as PaymentRow[];

  const byTeacher = new Map<string, { sum: number; count: number; groups: Set<string> }>();
  for (const p of payments) {
    const group = p.student?.group ?? null;
    const teacher = group?.teacher?.full_name?.trim() || NO_TEACHER;
    const cur = byTeacher.get(teacher) ?? { sum: 0, count: 0, groups: new Set<string>() };
    cur.sum += Number(p.amount);
    cur.count += 1;
    if (group?.name) cur.groups.add(group.name);
    byTeacher.set(teacher, cur);
  }
  const rows = [...byTeacher.entries()]
    .map(([teacher, v]) => ({ teacher, sum: v.sum, count: v.count, groups: [...v.groups] }))
    .sort((a, b) => b.sum - a.sum);
  const total = rows.reduce((s, r) => s + r.sum, 0);

  return (
    <div className="space-y-4">
      <InlineFilters
        storageKey="earned"
        configurable={false}
        fields={[
          { name: "from", label: "Sanadan", type: "date", width: "w-40" },
          { name: "to", label: "Sanagacha", type: "date", width: "w-40" },
        ]}
      />

      <ReportCards
        items={[
          { label: "Jami tushum", value: formatSom(total), tone: "good" },
          { label: "O'qituvchilar", value: rows.filter((r) => r.teacher !== NO_TEACHER).length },
          { label: "To'lovlar soni", value: payments.length },
        ]}
      />

      <ReportTable
        rows={rows}
        rowKey={(r) => r.teacher}
        columns={[
          { header: "O'qituvchi", cell: (r) => <span className="font-medium text-ink">{r.teacher}</span> },
          { header: "Guruhlar", cell: (r) => (r.groups.length ? r.groups.join(", ") : "—") },
          { header: "To'lovlar soni", cell: (r) => r.count },
          { header: "Tushum", align: "right", cell: (r) => <span className="font-medium text-ink">{formatSom(r.sum)}</span> },
          {
            header: "Ulushi",
            cell: (r) => (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${total ? (r.sum / total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs">{total ? Math.round((r.sum / total) * 100) : 0}%</span>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
