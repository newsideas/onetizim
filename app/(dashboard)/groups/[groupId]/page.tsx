import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GroupInfoCard } from "@/components/groups/GroupInfoCard";
import { EditGroupButton } from "@/components/groups/EditGroupButton";
import { StudentsTable, type StudentTableRow } from "@/components/students/StudentsTable";
import type { Group } from "@/types/database";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const [{ data: group }, { data: students }] = await Promise.all([
    supabase
      .from("groups")
      .select("*, teacher:teachers(full_name)")
      .eq("id", groupId)
      .maybeSingle(),
    supabase
      .from("students")
      .select("*, group:groups(name)")
      .eq("group_id", groupId)
      .order("full_name"),
  ]);

  if (!group) notFound();

  // Supabase inferi to-one join'ni massiv deb hisoblaydi (0007 izohiga qarang).
  const teacherName =
    (group as { teacher?: { full_name: string } | null }).teacher?.full_name ?? null;
  const studentRows = (students ?? []) as unknown as StudentTableRow[];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/groups"
            className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Guruhlarga qaytish"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-semibold text-white">{group.name}</h1>
        </div>
        <EditGroupButton
          groupId={groupId}
          defaultValues={{
            name: group.name,
            subject: group.subject ?? undefined,
            teacherName: teacherName ?? undefined,
            room: group.room ?? undefined,
            scheduleDays: group.schedule_days ?? [],
            startTime: group.start_time ?? undefined,
            endTime: group.end_time ?? undefined,
            monthlyPrice: Number(group.monthly_price),
            educationType: (group as Group).education_type ?? "offline",
            startDate: group.start_date ?? undefined,
            endDate: group.end_date ?? undefined,
            lessonDurationMinutes: group.lesson_duration_minutes ?? undefined,
          }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <GroupInfoCard
            group={group as Group}
            teacherName={teacherName}
            studentCount={studentRows.length}
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <h2 className="text-sm font-semibold text-white/70">
            Guruh o&apos;quvchilari
          </h2>
          <StudentsTable students={studentRows} />
        </div>
      </div>
    </div>
  );
}
