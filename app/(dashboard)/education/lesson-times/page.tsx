import { createClient } from "@/lib/supabase/server";
import { ListPageShell } from "@/components/ui/ListPage";
import { ReferenceManager, type RefOption } from "@/components/settings/ReferenceManager";
import { getReference } from "@/lib/references";

export default async function LessonTimesPage() {
  const config = getReference("lesson-times");
  const supabase = await createClient();

  const [{ data }, { data: shifts }] = await Promise.all([
    supabase
      .from(config.table)
      .select("*")
      .order(config.orderBy.column, { ascending: config.orderBy.ascending }),
    supabase.from("shifts").select("id, name").order("name"),
  ]);

  const shiftOptions: RefOption[] = (shifts ?? []).map((s) => ({ id: s.id, label: s.name }));

  return (
    <ListPageShell title={config.title} subtitle={config.subtitle}>
      <ReferenceManager
        refKey="lesson-times"
        config={config}
        rows={data ?? []}
        refOptions={{ shifts: shiftOptions }}
      />
    </ListPageShell>
  );
}
