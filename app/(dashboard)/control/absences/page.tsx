import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { todayIso } from "@/lib/utils/date";

interface AttRow {
  student_id: string | null;
  group_id: string | null;
  status: string | null;
  student: { full_name: string } | null;
  group: { name: string } | null;
}

/** Bugundan n kun oldingi sana (YYYY-MM-DD). */
function daysAgo(n: number): string {
  const [y, m, d] = todayIso().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/**
 * Davomati bekor qilinganlar analitikasi: darsga kelmagan (qoldirgan) o'quvchilar —
 * o'quvchi bo'yicha qoldirilgan darslar soni va ulushi.
 */
export default async function AbsencesAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("attendance.mark");
  const from = params.from || daysAgo(30);
  const to = params.to || todayIso();

  const { data } = await supabase
    .from("attendance")
    .select("student_id, group_id, status, student:students(full_name), group:groups(name)")
    .gte("lesson_date", from)
    .lte("lesson_date", to);

  const records = (data ?? []) as unknown as AttRow[];
  const byStudent = new Map<string, { id: string; name: string; group: string; absent: number; total: number }>();
  for (const r of records) {
    if (!r.student_id) continue;
    const row = byStudent.get(r.student_id) ?? {
      id: r.student_id,
      name: r.student?.full_name ?? "—",
      group: r.group?.name ?? "—",
      absent: 0,
      total: 0,
    };
    row.total += 1;
    if (r.status === "absent") row.absent += 1;
    byStudent.set(r.student_id, row);
  }
  const rows = [...byStudent.values()]
    .filter((r) => r.absent > 0)
    .sort((a, b) => b.absent - a.absent);
  const absentTotal = records.filter((r) => r.status === "absent").length;

  return (
    <div className="space-y-4">
      <InlineFilters
        storageKey="absences"
        configurable={false}
        fields={[
          { name: "from", label: "Sanadan", type: "date", width: "w-44" },
          { name: "to", label: "Sanagacha", type: "date", width: "w-44" },
        ]}
      />
      <ReportCards
        items={[
          { label: "Jami davomat yozuvlari", value: records.length },
          { label: "Kelmaganlar", value: absentTotal, tone: absentTotal > 0 ? "bad" : "good" },
          {
            label: "Kelmaslik ulushi",
            value: records.length ? `${Math.round((absentTotal / records.length) * 100)}%` : "—",
          },
          { label: "Kelmagan o'quvchilar", value: rows.length },
        ]}
      />
      <ReportTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          {
            header: "O'quvchi",
            cell: (r) => (
              <Link href={`/education/students/${r.id}`} className="font-medium text-brand-600 hover:underline">
                {r.name}
              </Link>
            ),
          },
          { header: "Guruh", cell: (r) => r.group },
          { header: "Kelmagan darslar", cell: (r) => r.absent },
          { header: "Jami darslar", cell: (r) => r.total },
          { header: "Ulushi", cell: (r) => `${Math.round((r.absent / r.total) * 100)}%` },
        ]}
      />
    </div>
  );
}
