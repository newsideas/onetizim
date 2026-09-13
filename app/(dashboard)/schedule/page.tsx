import { createClient } from "@/lib/supabase/server";
import { ScheduleGrid, type ScheduleGroup } from "@/components/schedule/ScheduleGrid";

export default async function SchedulePage() {
  const supabase = await createClient();

  const { data: groups } = await supabase
    .from("groups")
    .select(
      "id, name, schedule_days, start_time, end_time, teacher:teachers(full_name), room:rooms(name), course:courses(name)",
    )
    .order("start_time", { nullsFirst: false });

  // Supabase'ning TS inferi har qanday join'ni massiv deb hisoblaydi, lekin
  // groups.teacher_id many-to-one FK bo'lgani uchun PostgREST yakka obyekt
  // qaytaradi. Generated tiplar (supabase gen types) qo'shilganda bu cast
  // keraksiz bo'ladi.
  const scheduleGroups = (groups ?? []) as unknown as ScheduleGroup[];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white">Dars jadvali</h1>
      <ScheduleGrid groups={scheduleGroups} />
    </div>
  );
}
