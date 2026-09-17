import { createClient } from "@/lib/supabase/server";
import { ListPageShell } from "@/components/ui/ListPage";
import { ReferenceManager } from "@/components/settings/ReferenceManager";
import { getReference } from "@/lib/references";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { termsFor } from "@/lib/segment";

export default async function ClassTypesPage() {
  const config = getReference("class-types");
  const supabase = await createClient();
  const terms = termsFor((await getCurrentOrg(supabase)).type);

  const { data } = await supabase
    .from(config.table)
    .select("*")
    .order(config.orderBy.column, { ascending: config.orderBy.ascending });

  return (
    <ListPageShell title={`${terms.group} turlari`} subtitle={config.subtitle}>
      <ReferenceManager refKey="class-types" config={config} rows={data ?? []} />
    </ListPageShell>
  );
}
