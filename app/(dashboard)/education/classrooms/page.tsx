import { createClient } from "@/lib/supabase/server";
import { ListPageShell } from "@/components/ui/ListPage";
import { CatalogManager, type CatalogItem } from "@/components/settings/CatalogManager";

export default async function ClassroomsPage() {
  const supabase = await createClient();
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name")
    .order("name");

  return (
    <ListPageShell title="Auditoriyalar" subtitle="Auditoriyalar ro&apos;yxati">
      <div className="max-w-xl">
        <CatalogManager
          table="rooms"
          title="Auditoriyalar"
          placeholder="Auditoriya nomi"
          items={(rooms ?? []) as CatalogItem[]}
        />
      </div>
    </ListPageShell>
  );
}
