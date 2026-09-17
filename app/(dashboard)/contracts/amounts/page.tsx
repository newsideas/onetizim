import { createClient } from "@/lib/supabase/server";
import { ListPageShell } from "@/components/ui/ListPage";
import { ReferenceManager, type RefOption } from "@/components/settings/ReferenceManager";
import { getReference } from "@/lib/references";

export default async function ContractAmountsPage() {
  const config = getReference("contract-amounts");
  const supabase = await createClient();

  const [{ data }, { data: years }, { data: classTypes }] = await Promise.all([
    supabase
      .from(config.table)
      .select("*")
      .order(config.orderBy.column, { ascending: config.orderBy.ascending }),
    supabase.from("academic_years").select("id, name").order("name"),
    supabase.from("class_types").select("id, name").order("name"),
  ]);

  const yearOptions: RefOption[] = (years ?? []).map((y) => ({ id: y.id, label: y.name }));
  const classTypeOptions: RefOption[] = (classTypes ?? []).map((c) => ({
    id: c.id,
    label: c.name,
  }));

  return (
    <ListPageShell title={config.title} subtitle={config.subtitle}>
      <ReferenceManager
        refKey="contract-amounts"
        config={config}
        rows={data ?? []}
        refOptions={{ "academic-years": yearOptions, "class-types": classTypeOptions }}
      />
    </ListPageShell>
  );
}
