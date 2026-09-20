import { requirePermission } from "@/lib/auth/session";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { todayIso } from "@/lib/utils/date";

/** Bugundan n kun oldingi sana (Toshkent, YYYY-MM-DD). */
function daysAgo(n: number): string {
  const [y, m, d] = todayIso().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

interface GroupRow {
  id: string;
  teacher_id: string | null;
  students: { id: string; status: string }[];
}

/**
 * Xodimlar reytingi: o'qituvchilar guruhlari soni, o'quvchilari va so'nggi 30 kundagi
 * davomat foizi bo'yicha (davomat foizi yuqori bo'lgani birinchi).
 */
export default async function StaffRatingPage() {
  const { supabase } = await requirePermission("attendance.mark");
  const from = daysAgo(30);

  const [teachersRes, groupsRes, attendanceRes] = await Promise.all([
    supabase.from("teachers").select("id, full_name, position").order("full_name"),
    supabase.from("groups").select("id, teacher_id, students(id, status)").neq("status", "archived"),
    supabase.from("attendance").select("group_id, status").gte("lesson_date", from),
  ]);

  const groups = (groupsRes.data ?? []) as unknown as GroupRow[];
  const teacherOfGroup = new Map(groups.map((g) => [g.id, g.teacher_id]));

  const att = new Map<string, { ok: number; total: number }>();
  for (const a of (attendanceRes.data ?? []) as { group_id: string | null; status: string }[]) {
    const teacher = a.group_id ? teacherOfGroup.get(a.group_id) : null;
    if (!teacher) continue;
    const cur = att.get(teacher) ?? { ok: 0, total: 0 };
    cur.total += 1;
    if (a.status === "present" || a.status === "late") cur.ok += 1;
    att.set(teacher, cur);
  }

  const rows = (teachersRes.data ?? [])
    .map((t) => {
      const own = groups.filter((g) => g.teacher_id === t.id);
      const a = att.get(t.id as string);
      return {
        id: t.id as string,
        name: t.full_name as string,
        position: (t.position as string | null) ?? "—",
        groups: own.length,
        students: own.reduce((s, g) => s + g.students.filter((x) => x.status === "active").length, 0),
        percent: a && a.total ? Math.round((a.ok / a.total) * 100) : null,
      };
    })
    .sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));

  return (
    <div className="space-y-4">
      <ReportCards
        items={[
          { label: "Xodimlar", value: rows.length },
          { label: "Guruhlar", value: groups.length },
          {
            label: "O'rtacha davomat",
            value: (() => {
              const withData = rows.filter((r) => r.percent !== null);
              return withData.length
                ? `${Math.round(withData.reduce((s, r) => s + (r.percent ?? 0), 0) / withData.length)}%`
                : "—";
            })(),
          },
        ]}
      />
      <ReportTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { header: "Xodim", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
          { header: "Lavozimi", cell: (r) => r.position },
          { header: "Guruhlar", cell: (r) => r.groups },
          { header: "O'quvchilar", cell: (r) => r.students },
          {
            header: "Davomat (30 kun)",
            cell: (r) =>
              r.percent === null ? (
                "—"
              ) : (
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
