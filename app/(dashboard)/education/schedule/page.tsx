import { requirePermission } from "@/lib/auth/session";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { DayScheduleGrid } from "@/components/schedule/DayScheduleGrid";
import {
  buildEntries,
  type LessonRow,
  type ScheduleGroup,
} from "@/components/schedule/schedule-entries";
import { NewLessonButton } from "@/components/schedule/NewLessonButton";
import type { LessonOptions } from "@/components/schedule/LessonFormModal";
import {
  ScheduleViewToggle,
  DayPicker,
  type ScheduleView,
} from "@/components/schedule/ScheduleControls";
import { HAFTA_KUNLARI, bugungiKun } from "@/lib/utils/date";

const SCHEDULE_SELECT =
  "id, name, schedule_days, start_time, end_time, lesson_duration_minutes, " +
  "teacher:teachers(full_name), room:rooms(id, name), course:courses(name)";

const LESSON_SELECT =
  "id, group_id, teacher_id, room_id, subject, weekday, start_time, end_time, " +
  "group:groups(name), teacher:teachers(full_name), room:rooms(id, name)";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; day?: string }>;
}) {
  const params = await searchParams;
  const view: ScheduleView = params.view === "day" ? "day" : "week";
  const day =
    params.day && (HAFTA_KUNLARI as readonly string[]).includes(params.day)
      ? params.day
      : bugungiKun();

  const { supabase, permissions } = await requirePermission("schedule.view");
  const canManage = permissions.includes("groups.manage");

  const [{ data: groups }, lessonsResult] = await Promise.all([
    supabase.from("groups").select(SCHEDULE_SELECT).order("start_time", { nullsFirst: false }),
    supabase.from("lessons").select(LESSON_SELECT).order("start_time"),
  ]);

  // Supabase'ning TS inferi har qanday join'ni massiv deb hisoblaydi, lekin
  // many-to-one FK uchun PostgREST yakka obyekt qaytaradi. Generated tiplar
  // (supabase gen types) qo'shilganda bu cast keraksiz bo'ladi.
  const scheduleGroups = (groups ?? []) as unknown as ScheduleGroup[];
  const lessons = (lessonsResult.data ?? []) as unknown as LessonRow[];
  const entries = buildEntries(scheduleGroups, lessons);

  let options: LessonOptions | null = null;
  if (canManage) {
    const [{ data: groupOptions }, { data: teachers }, { data: rooms }] = await Promise.all([
      supabase.from("groups").select("id, name").order("name"),
      supabase.from("teachers").select("id, full_name").order("full_name"),
      supabase.from("rooms").select("id, name").order("name"),
    ]);
    options = {
      groups: groupOptions ?? [],
      teachers: teachers ?? [],
      rooms: rooms ?? [],
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink">Dars jadvali</h1>
        <div className="flex flex-wrap items-center gap-3">
          <ScheduleViewToggle view={view} day={day} />
          {options && <NewLessonButton options={options} />}
        </div>
      </div>

      {lessonsResult.error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Darslar jadvali bazada topilmadi — 0028_lessons.sql migratsiyasini Supabase SQL
          Editor&apos;da ishga tushiring.
        </p>
      )}

      {view === "day" ? (
        <>
          <DayPicker current={day} />
          <DayScheduleGrid entries={entries} day={day} options={options} />
        </>
      ) : (
        <ScheduleGrid entries={entries} options={options} />
      )}
    </div>
  );
}
