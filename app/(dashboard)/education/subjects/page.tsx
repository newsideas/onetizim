import { createClient } from "@/lib/supabase/server";
import { ListPageShell } from "@/components/ui/ListPage";
import { CatalogManager, type CatalogItem } from "@/components/settings/CatalogManager";

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .order("name");

  return (
    <ListPageShell title="Fanlar" subtitle="Fanlar ro&apos;yxati">
      <div className="max-w-xl">
        <CatalogManager
          table="courses"
          title="Fanlar"
          placeholder="Fan nomi"
          items={(courses ?? []) as CatalogItem[]}
        />
      </div>
    </ListPageShell>
  );
}
