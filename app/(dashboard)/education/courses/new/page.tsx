import { requirePermission } from "@/lib/auth/session";
import { CourseForm } from "@/components/courses/CourseForm";

/** Yangi kurs qo'shish (Edu tizimdagi "Oflayn kurslar → Qo'shish" sahifasi). */
export default async function NewCoursePage() {
  const { supabase } = await requirePermission("settings.manage");

  const { data } = await supabase.from("branches").select("id, name").eq("is_active", true).order("name");
  const branches = ((data ?? []) as { id: string; name: string }[]).map((b) => ({
    branchId: b.id,
    name: b.name,
    available: true,
    price: "",
  }));

  return <CourseForm branches={branches} />;
}
