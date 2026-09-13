"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { groupSchema, type GroupInput } from "@/lib/validations/group";

/**
 * Yangi guruh yaratadi. O'qituvchi nomi kiritilgan bo'lsa, mavjud
 * bo'lmasa teachers jadvaliga yangi yozuv sifatida qo'shadi.
 */
export async function createGroup(input: GroupInput) {
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
  }
  const values = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Avtorizatsiyadan o'tilmagan");

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!org) throw new Error("Tashkilot topilmadi");

  let teacherId: string | null = null;
  const teacherName = values.teacherName?.trim();

  if (teacherName) {
    const { data: existingTeacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("org_id", org.id)
      .eq("full_name", teacherName)
      .maybeSingle();

    if (existingTeacher) {
      teacherId = existingTeacher.id;
    } else {
      const { data: newTeacher, error: teacherError } = await supabase
        .from("teachers")
        .insert({ org_id: org.id, full_name: teacherName })
        .select("id")
        .single();

      if (teacherError) {
        throw new Error("O'qituvchini saqlashda xatolik: " + teacherError.message);
      }
      teacherId = newTeacher.id;
    }
  }

  const { error } = await supabase.from("groups").insert({
    org_id: org.id,
    name: values.name,
    subject: values.subject || null,
    teacher_id: teacherId,
    room: values.room || null,
    schedule_days: values.scheduleDays,
    start_time: values.startTime || null,
    end_time: values.endTime || null,
    monthly_price: values.monthlyPrice,
  });

  if (error) {
    throw new Error("Guruh yaratishda xatolik: " + error.message);
  }

  revalidatePath("/groups");
}
