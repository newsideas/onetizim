import { createClient } from "@/lib/supabase/server";
import { GroupsTable, type GroupRow } from "@/components/groups/GroupsTable";
import { NewGroupButton } from "@/components/groups/NewGroupButton";

export default async function GroupsPage() {
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("groups")
    .select("*, teacher:teachers(full_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Guruhlar</h1>
        <NewGroupButton />
      </div>
      <GroupsTable groups={(groups as GroupRow[]) ?? []} />
    </div>
  );
}
