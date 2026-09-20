import { requirePermission } from "@/lib/auth/session";
import { WorkScheduleForm } from "@/components/staff/WorkScheduleForm";

/** Yangi ish jadvali (Edu tizimdagi "Ish jadvali qo'shish" sahifasi). */
export default async function NewWorkSchedulePage() {
  await requirePermission("settings.manage");
  return <WorkScheduleForm />;
}
