import { createClient } from "@/lib/supabase/server";
import { ListPageShell } from "@/components/ui/ListPage";
import { ReferenceManager, type RefOption } from "@/components/settings/ReferenceManager";
import { getReference } from "@/lib/references";

export default async function AcademicPeriodsPage() {
  const config = getReference("academic-periods");
  const supabase = await createClient();

  const [{ data }, { data: years }] = await Promise.all([
    supabase
      .from(config.table)
      .select("*")
      .order(config.orderBy.column, { ascending: config.orderBy.ascending }),
    supabase.from("academic_years").select("id, name").order("name"),
  ]);

  const yearOptions: RefOption[] = (years ?? []).map((y) => ({ id: y.id, label: y.name }));

  return (
    <ListPageShell title={config.title} subtitle={config.subtitle}>
      <ReferenceManager
        refKey="academic-periods"
        config={config}
        rows={data ?? []}
        refOptions={{ "academic-years": yearOptions }}
      />
    </ListPageShell>
  );
}
