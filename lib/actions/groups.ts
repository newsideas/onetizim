"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/supabase/getCurrentOrg";
import { groupSchema, type GroupInput } from "@/lib/validations/group";

/**
 * O'qituvchi nomi bo'yicha mavjudini topadi, bo'lmasa yangi yozuv yaratadi.
 * Nom bo'sh bo'lsa null qaytaradi (o'qituvchi ixtiyoriy).
 */
async function resolveTeacherId(
  supabase: SupabaseClient,
  orgId: string,
  teacherName: string | undefined,
): Promise<string | null> {
  const name = teacherName?.trim();
  if (!name) return null;

  const { data: existing } = await supabase
    .from("teachers")
    .select("id")
    .eq("org_id", orgId)
    .eq("full_name", name)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("teachers")
    .insert({ org_id: orgId, full_name: name })
    .select("id")
    .single();

  if (error) throw new Error("O'qituvchini saqlashda xatolik: " + error.message);
  return created.id;
}

/** Formadagi qiymatlarni groups jadvalidagi ustunlarga moslashtiradi. */
function toGroupRow(values: GroupInput, teacherId: string | null) {
  return {
    name: values.name,
    subject: values.subject || null,
    teacher_id: teacherId,
    room: values.room || null,
    schedule_days: values.scheduleDays,
    start_time: values.startTime || null,
    end_time: values.endTime || null,
    monthly_price: values.monthlyPrice,
    education_type: values.educationType,
    start_date: values.startDate || null,
    end_date: values.endDate || null,
    lesson_duration_minutes: values.lessonDurationMinutes ?? null,
  };
}

export async function createGroup(input: GroupInput) {
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
  }
  const values = parsed.data;

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  const teacherId = await resolveTeacherId(supabase, orgId, values.teacherName);

  const { error } = await supabase
    .from("groups")
    .insert({ org_id: orgId, ...toGroupRow(values, teacherId) });

  if (error) throw new Error("Guruh yaratishda xatolik: " + error.message);

  revalidatePath("/groups");
  revalidatePath("/schedule");
}

export async function updateGroup(groupId: string, input: GroupInput) {
  const parsed = groupSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
  }
  const values = parsed.data;

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);
  const teacherId = await resolveTeacherId(supabase, orgId, values.teacherName);

  // RLS guruhni faqat o'z tashkilotida o'zgartirishga ruxsat beradi.
  const { error } = await supabase
    .from("groups")
    .update(toGroupRow(values, teacherId))
    .eq("id", groupId);

  if (error) throw new Error("Guruhni yangilashda xatolik: " + error.message);

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/schedule");
}
