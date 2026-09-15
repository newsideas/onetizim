import { createClient } from "@/lib/supabase/server";
import { getAttendanceForGroup } from "@/lib/actions/attendance";
import { AttendanceFilters } from "@/components/attendance/AttendanceFilters";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; date?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: groups } = await supabase.from("groups").select("id, name").order("name");

  if (!groups || groups.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-ink">Davomat</h1>
        <div className="rounded-xl border border-line p-8 text-center text-ink-faint">
          Avval kamida bitta guruh yarating.
        </div>
      </div>
    );
  }

  const groupId =
    params.group && groups.some((g) => g.id === params.group)
      ? params.group
      : groups[0].id;
  const date = params.date || todayIso();

  const students = await getAttendanceForGroup(groupId, date);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">Davomat</h1>
      <AttendanceFilters groups={groups} groupId={groupId} date={date} />
      <AttendanceTable
        key={`${groupId}-${date}`}
        initialStudents={students}
        groupId={groupId}
        date={date}
      />
    </div>
  );
}
