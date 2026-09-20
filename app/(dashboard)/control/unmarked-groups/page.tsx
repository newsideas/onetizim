import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import {
  buildEntries,
  type LessonRow,
  type ScheduleGroup,
} from "@/components/schedule/schedule-entries";
import { HAFTA_KUNLARI, formatTime, todayIso } from "@/lib/utils/date";

/** Davomat qilinmagan guruhlar: tanlangan kuni darsi bor, lekin davomat belgilanmagan guruhlar. */
export default async function UnmarkedGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const { supabase } = await requirePermission("attendance.mark");

  const date = dateParam || todayIso();
  const [y, m, d] = date.split("-").map(Number);
  const dayName = HAFTA_KUNLARI[(new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7];

  const [groupsRes, lessonsRes, attendanceRes] = await Promise.all([
    supabase
      .from("groups")
      .select(
        "id, name, schedule_days, start_time, end_time, lesson_duration_minutes, " +
          "teacher:teachers(full_name), room:rooms(id, name), course:courses(name)",
      )
      .neq("status", "archived"),
    supabase
      .from("lessons")
      .select(
        "id, group_id, teacher_id, room_id, subject, weekday, start_time, end_time, " +
          "group:groups(name), teacher:teachers(full_name), room:rooms(id, name)",
      ),
    supabase.from("attendance").select("group_id").eq("lesson_date", date),
  ]);

  const marked = new Set((attendanceRes.data ?? []).map((a) => a.group_id as string));
  const groups = (groupsRes.data ?? []) as unknown as (ScheduleGroup & { id: string })[];
  const lessons = (lessonsRes.data ?? []) as unknown as LessonRow[];

  // Kun jadvali: dars jadvali (lessons) yoki guruhning o'z kunlari.
  const entries = buildEntries(groups, lessons).filter((e) => e.day === dayName);
  const groupIdByName = new Map(groups.map((g) => [g.name, g.id]));

  const seen = new Set<string>();
  const rows = entries
    .map((e) => {
      const name = e.groupName ?? e.title;
      return { key: e.key, id: groupIdByName.get(name) ?? name, name, entry: e };
    })
    .filter((r) => {
      if (marked.has(r.id) || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

  return (
    <div className="space-y-4">
      <InlineFilters
        storageKey="unmarked-groups"
        configurable={false}
        fields={[{ name: "date", label: "Sana", type: "date", width: "w-40" }]}
      />
      <ReportCards
        items={[
          { label: `${dayName} kuni darsi bor guruhlar`, value: new Set(entries.map((e) => e.groupName ?? e.title)).size },
          { label: "Davomat belgilanmagan", value: rows.length, tone: rows.length > 0 ? "bad" : "good" },
        ]}
      />
      <ReportTable
        rows={rows}
        rowKey={(r) => r.key}
        columns={[
          { header: "Guruh", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
          {
            header: "Dars vaqti",
            cell: (r) =>
              r.entry.startTime
                ? `${formatTime(r.entry.startTime)}${r.entry.endTime ? ` - ${formatTime(r.entry.endTime)}` : ""}`
                : "—",
          },
          { header: "O'qituvchi", cell: (r) => r.entry.teacher ?? "—" },
          { header: "Xona", cell: (r) => r.entry.roomName ?? "—" },
        ]}
      />
    </div>
  );
}
