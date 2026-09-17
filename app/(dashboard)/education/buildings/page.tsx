import { createClient } from "@/lib/supabase/server";
import { ListPageShell } from "@/components/ui/ListPage";
import { ReferenceManager } from "@/components/settings/ReferenceManager";
import { getReference } from "@/lib/references";

export default async function BuildingsPage() {
  const config = getReference("buildings");
  const supabase = await createClient();

  const { data } = await supabase
    .from(config.table)
    .select("*")
    .order(config.orderBy.column, { ascending: config.orderBy.ascending });

  return (
    <ListPageShell title={config.title} subtitle={config.subtitle}>
      <ReferenceManager refKey="buildings" config={config} rows={data ?? []} />
    </ListPageShell>
  );
}
