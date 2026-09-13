"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/supabase/getCurrentOrg";
import { groupSchema, type GroupInput } from "@/lib/validations/group";

/**
 * Nom bo'yicha mavjud yozuvni topadi, bo'lmasa yangisini yaratadi.
 *
 * teachers, rooms va courses uchun bir xil ishlaydi: foydalanuvchi guruh
 * formasida shunchaki nom yozadi, tizim uni tegishli jadvalga normallashtirib
 * qo'yadi. Shunda ish oqimi sekinlashmaydi, baza esa toza qoladi.
 */
async function resolveByName(
  supabase: SupabaseClient,
  table: "teachers" | "rooms" | "courses",
  nameColumn: "full_name" | "name",
  orgId: string,
  rawName: string | undefined,
): Promise<string | null> {
  const name = rawName?.trim();
  if (!name) return null;

  const { data: existing } = await supabase
    .from(table)
    .select("id")
    .eq("org_id", orgId)
    .eq(nameColumn, name)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from(table)
    .insert({ org_id: orgId, [nameColumn]: name })
    .select("id")
    .single();

  if (error) throw new Error(`Saqlashda xatolik (${table}): ` + error.message);
  return created.id;
}

async function resolveRelations(
  supabase: SupabaseClient,
  orgId: string,
  values: GroupInput,
) {
  const [teacherId, roomId, courseId] = await Promise.all([
    resolveByName(supabase, "teachers", "full_name", orgId, values.teacherName),
    resolveByName(supabase, "rooms", "name", orgId, values.room),
    resolveByName(supabase, "courses", "name", orgId, values.subject),
  ]);

  return { teacherId, roomId, courseId };
}

function toGroupRow(
  values: GroupInput,
  rel: { teacherId: string | null; roomId: string | null; courseId: string | null },
) {
  return {
    name: values.name,
    teacher_id: rel.teacherId,
    room_id: rel.roomId,
    course_id: rel.courseId,
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
  const rel = await resolveRelations(supabase, orgId, values);

  const { error } = await supabase
    .from("groups")
    .insert({ org_id: orgId, ...toGroupRow(values, rel) });

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
  const rel = await resolveRelations(supabase, orgId, values);

  // RLS guruhni faqat o'z tashkilotida o'zgartirishga ruxsat beradi.
  const { error } = await supabase
    .from("groups")
    .update(toGroupRow(values, rel))
    .eq("id", groupId);

  if (error) throw new Error("Guruhni yangilashda xatolik: " + error.message);

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/schedule");
}
