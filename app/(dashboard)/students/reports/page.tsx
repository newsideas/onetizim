import { createClient } from "@/lib/supabase/server";
import { ListPageShell, DataTable, type Column } from "@/components/ui/ListPage";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { termsFor } from "@/lib/segment";

interface GroupReportRow {
  id: string;
  name: string;
  total: number;
  active: number;
  frozen: number;
  archived: number;
}

/**
 * O'quvchilar hisoboti — sinf/guruh kesimida holat taqsimoti.
 * Jami qator har doim eng oxirida.
 */
export default async function StudentsReportsPage() {
  const supabase = await createClient();
  const terms = termsFor((await getCurrentOrg(supabase)).type);

  const [{ data: groups }, { data: students }] = await Promise.all([
    supabase.from("groups").select("id, name").order("name"),
    supabase.from("students").select("group_id, status"),
  ]);

  const byGroup = new Map<string, GroupReportRow>();
  for (const g of groups ?? []) {
    byGroup.set(g.id, { id: g.id, name: g.name, total: 0, active: 0, frozen: 0, archived: 0 });
  }

  let unassigned: GroupReportRow = {
    id: "unassigned",
    name: `${terms.group} biriktirilmagan`,
    total: 0,
    active: 0,
    frozen: 0,
    archived: 0,
  };

  for (const s of students ?? []) {
    const row = (s.group_id && byGroup.get(s.group_id)) || unassigned;
    row.total += 1;
    if (s.status === "active") row.active += 1;
    else if (s.status === "frozen") row.frozen += 1;
    else if (s.status === "archived") row.archived += 1;
  }

  const rows = [...byGroup.values(), unassigned].filter((r) => r.total > 0);

  const totals = rows.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      active: acc.active + r.active,
      frozen: acc.frozen + r.frozen,
      archived: acc.archived + r.archived,
    }),
    { total: 0, active: 0, frozen: 0, archived: 0 },
  );

  const columns: Column<GroupReportRow>[] = [
    { header: terms.group, cell: (row) => row.name },
    { header: "Jami", cell: (row) => row.total, align: "right" },
    { header: "Faol", cell: (row) => row.active, align: "right" },
    { header: "Muzlatilgan", cell: (row) => row.frozen, align: "right" },
    { header: "Arxiv", cell: (row) => row.archived, align: "right" },
  ];

  return (
    <ListPageShell
      title={`${terms.studentPlural} hisoboti`}
      subtitle={`${terms.group} kesimida holat taqsimoti`}
    >
      <DataTable rows={rows} columns={columns} total={rows.length} />

      {rows.length > 0 && (
        <div className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
          <span className="font-semibold text-ink">Jami: </span>
          <span className="text-ink-muted">
            {totals.total} ta — Faol {totals.active}, Muzlatilgan {totals.frozen}, Arxiv{" "}
            {totals.archived}
          </span>
        </div>
      )}
    </ListPageShell>
  );
}
