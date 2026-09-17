import { createClient } from "@/lib/supabase/server";
import { ListPageShell } from "@/components/ui/ListPage";
import { ReferenceManager, type RefOption } from "@/components/settings/ReferenceManager";
import { getReference } from "@/lib/references";

export default async function ClassroomsPage() {
  const config = getReference("classrooms");
  const supabase = await createClient();

  const [{ data }, { data: buildings }] = await Promise.all([
    supabase
      .from(config.table)
      .select("*")
      .order(config.orderBy.column, { ascending: config.orderBy.ascending }),
    supabase.from("buildings").select("id, name").order("name"),
  ]);

  const buildingOptions: RefOption[] = (buildings ?? []).map((b) => ({
    id: b.id,
    label: b.name,
  }));

  return (
    <ListPageShell title={config.title} subtitle={config.subtitle}>
      <ReferenceManager
        refKey="classrooms"
        config={config}
        rows={data ?? []}
        refOptions={{ buildings: buildingOptions }}
      />
    </ListPageShell>
  );
}
