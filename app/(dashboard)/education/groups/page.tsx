import { GroupsTabs } from "@/components/education/SectionTabs";
import { requirePermission } from "@/lib/auth/session";
import {
  GroupsTable,
  GROUP_SELECT,
  type GroupRow,
} from "@/components/groups/GroupsTable";
import { NewGroupButton } from "@/components/groups/NewGroupButton";
import { termsFor, type Segment } from "@/lib/segment";

export default async function GroupsPage() {
  const { supabase, org, permissions } = await requirePermission("groups.view");

  const segment: Segment = org.type;
  const terms = termsFor(segment);

  const { data: groups } = await supabase
    .from("groups")
    .select(GROUP_SELECT)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">{terms.groupPlural}</h1>
        {permissions.includes("groups.manage") && <NewGroupButton />}
      </div>
      {permissions.includes("students.manage") && <GroupsTabs current="list" />}
      <GroupsTable
        groups={(groups ?? []) as unknown as GroupRow[]}
        segment={segment}
        showPrice={permissions.includes("payments.manage")}
      />
    </div>
  );
}
