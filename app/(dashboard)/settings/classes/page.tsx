import { createClient } from "@/lib/supabase/server";
import {
  GroupsTable,
  GROUP_SELECT,
  type GroupRow,
} from "@/components/groups/GroupsTable";
import { NewGroupButton } from "@/components/groups/NewGroupButton";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { termsFor, type Segment } from "@/lib/segment";

export default async function GroupsPage() {
  const supabase = await createClient();

  const segment = ((await getCurrentOrg(supabase)).type ?? "markaz") as Segment;
  const terms = termsFor(segment);

  const { data: groups } = await supabase
    .from("groups")
    .select(GROUP_SELECT)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{terms.groupPlural}</h1>
        <NewGroupButton />
      </div>
      <GroupsTable
        groups={(groups ?? []) as unknown as GroupRow[]}
        segment={segment}
      />
    </div>
  );
}
