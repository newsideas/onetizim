import { GroupsTabs } from "@/components/education/SectionTabs";
import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";
import { StudentAssignTable, type AssignRow } from "@/components/students/StudentAssignTable";
import { termsFor } from "@/lib/segment";

export default async function StudentAssignPage() {
  const { supabase, org } = await requirePermission("students.manage");
  const terms = termsFor(org.type);

  const [{ data: students }, { data: groups }] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, group_id, created_at, group:groups(name)")
      .neq("status", "archived")
      .order("full_name"),
    supabase.from("groups").select("id, name").order("name"),
  ]);

  const rows: AssignRow[] = (students ?? []).map((s) => ({
    id: s.id,
    full_name: s.full_name,
    group_id: s.group_id,
    group_name: (s.group as unknown as { name: string } | null)?.name ?? null,
    created_at: s.created_at,
  }));

  return (
    <ListPageShell
      title={`${terms.student}ni biriktirish`}
      subtitle="Biriktirish ro'yxati"
      tabs={<GroupsTabs current="assign" />}
    >
      <StudentAssignTable
        rows={rows}
        groupLabel={terms.group}
        groups={groups ?? []}
      />
    </ListPageShell>
  );
}
