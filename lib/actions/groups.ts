"use server";

import { ActionError, runAction } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertPermission } from "@/lib/auth/session";
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

  if (error) throw new ActionError(`Saqlashda xatolik (${table}): ` + error.message);
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
    status: values.status,
    level: values.level?.trim() || null,
    telegram_url: values.telegramUrl?.trim() || null,
    start_date: values.startDate || null,
    end_date: values.endDate || null,
    lesson_duration_minutes: values.lessonDurationMinutes ?? null,
  };
}

export interface GroupFormOptions {
  courses: string[];
  teachers: string[];
  rooms: string[];
}

/** Guruh oynasidagi tanlov ro'yxatlari: kurslar, o'qituvchilar va xonalar (nomlari bilan). */
export async function getGroupFormOptions() {
  return runAction(async (): Promise<GroupFormOptions> => {
    const { supabase } = await assertPermission("groups.manage");
    const [courses, teachers, rooms] = await Promise.all([
      supabase.from("courses").select("name").order("name"),
      supabase.from("teachers").select("full_name").eq("is_active", true).order("full_name"),
      supabase.from("rooms").select("name").order("name"),
    ]);
    return {
      courses: ((courses.data ?? []) as { name: string }[]).map((c) => c.name),
      teachers: ((teachers.data ?? []) as { full_name: string }[]).map((t) => t.full_name),
      rooms: ((rooms.data ?? []) as { name: string }[]).map((r) => r.name),
    };
  });
}

export async function createGroup(input: GroupInput) {
  return runAction(async () => {
    const parsed = groupSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const values = parsed.data;

    const { supabase, org } = await assertPermission("groups.manage");
    const orgId = org.id;
    const rel = await resolveRelations(supabase, orgId, values);

    const { error } = await supabase
      .from("groups")
      .insert({ org_id: orgId, ...toGroupRow(values, rel) });

    if (error) throw new ActionError("Guruh yaratishda xatolik: " + error.message);

    revalidatePath("/education/groups");
    revalidatePath("/education/schedule");
  });
}

export async function updateGroup(groupId: string, input: GroupInput) {
  return runAction(async () => {
    const parsed = groupSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const values = parsed.data;

    const { supabase, org } = await assertPermission("groups.manage");
    const orgId = org.id;
    const rel = await resolveRelations(supabase, orgId, values);

    // RLS guruhni faqat o'z tashkilotida o'zgartirishga ruxsat beradi.
    const { error } = await supabase
      .from("groups")
      .update(toGroupRow(values, rel))
      .eq("id", groupId);

    if (error) throw new ActionError("Guruhni yangilashda xatolik: " + error.message);

    revalidatePath("/education/groups");
    revalidatePath(`/education/groups/${groupId}`);
    revalidatePath("/education/schedule");
  });
}
