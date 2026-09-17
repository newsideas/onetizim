import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GroupInfoCard } from "@/components/groups/GroupInfoCard";
import { EditGroupButton } from "@/components/groups/EditGroupButton";
import { GROUP_SELECT, type GroupRow } from "@/components/groups/GroupsTable";
import { StudentsTable, type StudentTableRow } from "@/components/students/StudentsTable";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { termsFor, type Segment } from "@/lib/segment";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const [{ data: groupData }, { data: students }, org] = await Promise.all([
    supabase.from("groups").select(GROUP_SELECT).eq("id", groupId).maybeSingle(),
    supabase
      .from("students")
      .select("*, group:groups(name)")
      .eq("group_id", groupId)
      .neq("status", "archived")
      .order("full_name"),
    getCurrentOrg(supabase),
  ]);

  if (!groupData) notFound();

  // Supabase inferi to-one join'ni massiv deb hisoblaydi (0008 izohiga qarang).
  const group = groupData as unknown as GroupRow;
  const studentRows = (students ?? []) as unknown as StudentTableRow[];
  const segment = (org.type ?? "markaz") as Segment;
  const terms = termsFor(segment);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/education/groups"
            className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
            aria-label={`${terms.groupPlural}ga qaytish`}
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-semibold text-ink">{group.name}</h1>
        </div>
        <EditGroupButton
          groupId={groupId}
          defaultValues={{
            name: group.name,
            subject: group.course?.name ?? undefined,
            teacherName: group.teacher?.full_name ?? undefined,
            room: group.room?.name ?? undefined,
            scheduleDays: group.schedule_days ?? [],
            startTime: group.start_time ?? undefined,
            endTime: group.end_time ?? undefined,
            monthlyPrice: Number(group.monthly_price),
            educationType: group.education_type ?? "offline",
            startDate: group.start_date ?? undefined,
            endDate: group.end_date ?? undefined,
            lessonDurationMinutes: group.lesson_duration_minutes ?? undefined,
          }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <GroupInfoCard
            group={group}
            studentCount={studentRows.length}
            segment={segment}
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink-muted">
            {terms.group} {terms.studentPlural.toLowerCase()}i
          </h2>
          <StudentsTable
            students={studentRows}
            emptyText={`Bu ${terms.group.toLowerCase()}da hali ${terms.student.toLowerCase()} yo'q.`}
            groupLabel={terms.group}
          />
        </div>
      </div>
    </div>
  );
}
