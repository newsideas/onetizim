import { createClient } from "@/lib/supabase/server";
import { ScheduleGrid, type ScheduleGroup } from "@/components/schedule/ScheduleGrid";
import { DayScheduleGrid } from "@/components/schedule/DayScheduleGrid";
import {
  ScheduleViewToggle,
  DayPicker,
  type ScheduleView,
} from "@/components/schedule/ScheduleControls";
import { HAFTA_KUNLARI, bugungiKun } from "@/lib/utils/date";

const SCHEDULE_SELECT =
  "id, name, schedule_days, start_time, end_time, lesson_duration_minutes, " +
  "teacher:teachers(full_name), room:rooms(id, name), course:courses(name)";

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

  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("groups")
    .select(SCHEDULE_SELECT)
    .order("start_time", { nullsFirst: false });

  // Supabase'ning TS inferi har qanday join'ni massiv deb hisoblaydi, lekin
  // many-to-one FK uchun PostgREST yakka obyekt qaytaradi. Generated tiplar
  // (supabase gen types) qo'shilganda bu cast keraksiz bo'ladi.
  const scheduleGroups = (groups ?? []) as unknown as ScheduleGroup[];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink">Dars jadvali</h1>
        <ScheduleViewToggle view={view} day={day} />
      </div>

      {view === "day" ? (
        <>
          <DayPicker current={day} />
          <DayScheduleGrid groups={scheduleGroups} day={day} />
        </>
      ) : (
        <ScheduleGrid groups={scheduleGroups} />
      )}
    </div>
  );
}
