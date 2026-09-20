import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { WorkScheduleForm, type DaysMap } from "@/components/staff/WorkScheduleForm";

interface ScheduleRow {
  name: string;
  year: number | null;
  code: string | null;
  days: DaysMap | null;
}

/** Ish jadvalini tahrirlash. */
export default async function EditWorkSchedulePage({ params }: { params: Promise<{ scheduleId: string }> }) {
  const { scheduleId } = await params;
  const { supabase } = await requirePermission("settings.manage");

  const { data } = await supabase
    .from("work_schedules")
    .select("name, year, code, days")
    .eq("id", scheduleId)
    .maybeSingle();
  const row = data as ScheduleRow | null;
  if (!row) notFound();

  return (
    <WorkScheduleForm
      scheduleId={scheduleId}
      initial={{
        name: row.name,
        year: row.year ?? new Date().getFullYear(),
        code: row.code ?? "",
        days: row.days ?? {},
      }}
    />
  );
}
