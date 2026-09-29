import { requirePermission } from "@/lib/auth/session";
import { HomeDashboard, type HomeOptions } from "@/components/home/HomeDashboard";
import {
  buildEntries,
  type LessonRow,
  type ScheduleGroup,
} from "@/components/schedule/schedule-entries";
import { NewLessonButton } from "@/components/schedule/NewLessonButton";
import type { LessonOptions } from "@/components/schedule/LessonFormModal";
import { bugungiKun } from "@/lib/utils/date";
import { SchoolTimetable } from "@/components/schedule/SchoolTimetable";

const SCHEDULE_SELECT =
  "id, name, schedule_days, start_time, end_time, end_date, lesson_duration_minutes, " +
  "teacher:teachers(full_name), room:rooms(id, name), course:courses(name)";

const LESSON_SELECT =
  "id, group_id, teacher_id, room_id, subject, weekday, start_time, end_time, " +
  "group:groups(name, end_date), teacher:teachers(full_name), room:rooms(id, name)";

export default async function SchedulePage() {
  const { supabase, permissions, org } = await requirePermission("schedule.view");
  const canManage = permissions.includes("groups.manage");
  const isSchool = org.type === "maktab";

  const [groupsRes, lessonsRes, teachersRes, roomsRes, coursesRes, slotsRes] = await Promise.all([
    supabase.from("groups").select(SCHEDULE_SELECT).order("start_time", { nullsFirst: false }),
    supabase.from("lessons").select(LESSON_SELECT).order("start_time"),
    supabase.from("teachers").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase.from("rooms").select("id, name").order("name"),
    supabase.from("courses").select("name").order("name"),
    // Maktab jadvali satrlari — "Dars vaqtlari" ma'lumotnomasi (1-soat, 2-soat…).
    isSchool
      ? supabase.from("lesson_times").select("position, start_time, end_time").order("position")
      : Promise.resolve({ data: [] as { position: number; start_time: string; end_time: string }[] }),
  ]);

  // Supabase'ning TS inferi many-to-one join'ni massiv deb hisoblaydi, lekin
  // PostgREST yakka obyekt qaytaradi. Generated tiplar qo'shilganda cast keraksiz bo'ladi.
  const groups = (groupsRes.data ?? []) as unknown as ScheduleGroup[];
  const lessons = (lessonsRes.data ?? []) as unknown as LessonRow[];
  const entries = buildEntries(groups, lessons);

  const teachers = teachersRes.data ?? [];
  const rooms = (roomsRes.data ?? []) as { id: string; name: string }[];
  const courses = (coursesRes.data ?? []).map((c) => c.name as string);

  const options: HomeOptions = {
    teachers: teachers.map((t) => t.full_name as string),
    groups: groups.map((g) => g.name),
    rooms,
    courses,
  };

  // Dars qo'shish va tahrirlash faqat direktor va administratorga (RLS ham shuni talab qiladi).
  const lessonOptions: LessonOptions | null = canManage
    ? {
        groups: groups.map((g) => ({ id: g.id, name: g.name })),
        teachers: teachers.map((t) => ({ id: t.id as string, full_name: t.full_name as string })),
        rooms,
        subjects: courses,
      }
    : null;

  if (isSchool) {
    const slots = ((slotsRes.data ?? []) as { position: number; start_time: string; end_time: string }[]).map(
      (s) => ({ position: s.position, start: s.start_time, end: s.end_time }),
    );
    const classes = groups
      .map((g) => ({ id: g.id, name: g.name }))
      .sort((a, b) => a.name.localeCompare(b.name, "uz", { numeric: true }));
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink">Dars jadvali</h1>
            <p className="text-sm text-ink-faint">Sinflar va o&apos;qituvchilarning haftalik jadvali</p>
          </div>
          {lessonOptions && <NewLessonButton options={lessonOptions} />}
        </div>
        <SchoolTimetable
          classes={classes}
          teachers={teachers.map((t) => ({ id: t.id as string, full_name: t.full_name as string }))}
          lessons={lessons}
          slots={slots}
          options={lessonOptions}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {lessonsRes.error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Darslar jadvali bazada topilmadi — 0028_lessons.sql migratsiyasini Supabase SQL
          Editor&apos;da ishga tushiring.
        </p>
      )}

      <HomeDashboard
        today={bugungiKun()}
        entries={entries}
        options={options}
        lessonOptions={lessonOptions}
        headerActions={lessonOptions ? <NewLessonButton options={lessonOptions} /> : undefined}
      />
    </div>
  );
}
