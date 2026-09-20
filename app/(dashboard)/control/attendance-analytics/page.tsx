import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { todayIso } from "@/lib/utils/date";

/** Bugundan n kun oldingi sana (Toshkent, YYYY-MM-DD). */
function daysAgo(n: number): string {
  const [y, m, d] = todayIso().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/** Davomat analitikasi: tanlangan davrda guruhlar bo'yicha kelgan / kechikkan / kelmagan. */
export default async function AttendanceAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("attendance.mark");

  const to = params.to || todayIso();
  const from = params.from || daysAgo(30);

  const [attendanceRes, groupsRes] = await Promise.all([
    supabase
      .from("attendance")
      .select("group_id, status")
      .gte("lesson_date", from)
      .lte("lesson_date", to),
    supabase.from("groups").select("id, name").order("name"),
  ]);

  const names = new Map((groupsRes.data ?? []).map((g) => [g.id as string, g.name as string]));
  const stats = new Map<string, { present: number; late: number; absent: number }>();
  for (const a of (attendanceRes.data ?? []) as { group_id: string | null; status: string }[]) {
    if (!a.group_id || (params.group && a.group_id !== params.group)) continue;
    const cur = stats.get(a.group_id) ?? { present: 0, late: 0, absent: 0 };
    if (a.status === "present") cur.present += 1;
    else if (a.status === "late") cur.late += 1;
    else if (a.status === "absent") cur.absent += 1;
    stats.set(a.group_id, cur);
  }

  const rows = [...stats.entries()]
    .map(([id, s]) => {
      const marked = s.present + s.late + s.absent;
      return { id, name: names.get(id) ?? "—", ...s, marked, percent: marked ? Math.round(((s.present + s.late) / marked) * 100) : 0 };
    })
    .sort((a, b) => a.percent - b.percent);

  const totals = rows.reduce(
    (t, r) => ({ present: t.present + r.present, late: t.late + r.late, absent: t.absent + r.absent }),
    { present: 0, late: 0, absent: 0 },
  );
  const marked = totals.present + totals.late + totals.absent;

  return (
    <div className="space-y-4">
      <InlineFilters
        storageKey="attendance-analytics"
        configurable={false}
        fields={[
          { name: "from", label: "Sanadan", type: "date", width: "w-40" },
          { name: "to", label: "Sanagacha", type: "date", width: "w-40" },
          {
            name: "group",
            label: "Guruh",
            type: "select",
            options: (groupsRes.data ?? []).map((g) => ({ value: g.id as string, label: g.name as string })),
          },
        ]}
      />
      <ReportCards
        items={[
          { label: "Kelgan", value: totals.present, tone: "good" },
          { label: "Kechikkan", value: totals.late },
          { label: "Kelmagan", value: totals.absent, tone: "bad" },
          { label: "Davomat foizi", value: marked ? `${Math.round(((totals.present + totals.late) / marked) * 100)}%` : "—" },
        ]}
      />
      <ReportTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { header: "Guruh", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
          { header: "Kelgan", cell: (r) => r.present },
          { header: "Kechikkan", cell: (r) => r.late },
          { header: "Kelmagan", cell: (r) => r.absent },
          {
            header: "Davomat",
            cell: (r) => (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${r.percent}%` }} />
                </div>
                <span className="text-xs">{r.percent}%</span>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
