import { requirePermission } from "@/lib/auth/session";
import { getOrgMembers } from "@/lib/staff";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";

/** Administratorlar samaradorligi: har bir mas'ul xodimning buyurtmalari va o'quvchi bo'lganlari. */
export default async function ManagersReportPage() {
  const { supabase, org } = await requirePermission("leads.manage");

  const [{ data }, members] = await Promise.all([
    supabase.from("leads").select("assigned_to, stage"),
    getOrgMembers(supabase, org.id),
  ]);

  const names = new Map(members.map((m) => [m.userId, m.name]));
  const stats = new Map<string, { total: number; enrolled: number; lost: number }>();
  for (const l of (data ?? []) as { assigned_to: string | null; stage: string }[]) {
    const key = l.assigned_to ?? "__none__";
    const cur = stats.get(key) ?? { total: 0, enrolled: 0, lost: 0 };
    cur.total += 1;
    if (l.stage === "enrolled") cur.enrolled += 1;
    if (l.stage === "lost") cur.lost += 1;
    stats.set(key, cur);
  }

  const rows = [...stats.entries()]
    .map(([id, s]) => ({
      id,
      name: id === "__none__" ? "Mas'ul biriktirilmagan" : (names.get(id) ?? "—"),
      ...s,
      percent: s.total ? Math.round((s.enrolled / s.total) * 100) : 0,
    }))
    .sort((a, b) => b.percent - a.percent || b.total - a.total);

  return (
    <div className="space-y-4">
      <ReportCards
        items={[
          { label: "Jami buyurtmalar", value: rows.reduce((s, r) => s + r.total, 0) },
          { label: "O'quvchi bo'lganlar", value: rows.reduce((s, r) => s + r.enrolled, 0), tone: "good" },
          { label: "Mas'ullar", value: rows.filter((r) => r.id !== "__none__").length },
        ]}
      />
      <ReportTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { header: "Mas'ul xodim", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
          { header: "Buyurtmalar", cell: (r) => r.total },
          { header: "O'quvchi bo'ldi", cell: (r) => r.enrolled },
          { header: "Rad etildi", cell: (r) => r.lost },
          {
            header: "Konversiya",
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
