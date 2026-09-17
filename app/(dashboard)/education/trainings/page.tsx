import { createClient } from "@/lib/supabase/server";
import { ListPageShell } from "@/components/ui/ListPage";
import { ReferenceManager } from "@/components/settings/ReferenceManager";
import { getReference } from "@/lib/references";

export default async function TrainingsPage() {
  const config = getReference("trainings");
  const supabase = await createClient();

  const { data } = await supabase
    .from(config.table)
    .select("*")
    .order(config.orderBy.column, { ascending: config.orderBy.ascending });

  return (
    <ListPageShell title={config.title} subtitle={config.subtitle}>
      <ReferenceManager refKey="trainings" config={config} rows={data ?? []} />
    </ListPageShell>
  );
}
