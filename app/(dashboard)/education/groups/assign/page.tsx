import { GroupsTabs } from "@/components/education/SectionTabs";
import { createClient } from "@/lib/supabase/server";
import { ListPageShell } from "@/components/ui/ListPage";
import { StudentAssignTable, type AssignRow } from "@/components/students/StudentAssignTable";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { termsFor } from "@/lib/segment";

export default async function StudentAssignPage() {
  const supabase = await createClient();
  const terms = termsFor((await getCurrentOrg(supabase)).type);

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
