"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import { HAFTA_KUNLARI, timeToMinutes } from "@/lib/utils/date";
import { lessonSchema, type LessonInput } from "@/lib/validations/lesson";

interface ExistingLesson {
  weekday: number;
  start_time: string;
  end_time: string;
  group_id: string;
  teacher_id: string | null;
  room_id: string | null;
}

interface ParsedLesson {
  groupId: string;
  teacherId?: string;
  roomId?: string;
  weekdays: number[];
  startTime: string;
  endTime: string;
}

function parseLesson(input: LessonInput) {
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
  }
  return parsed.data;
}

/** Sinf, o'qituvchi yoki xona shu vaqtda band bo'lsa xato tashlaydi. */
async function assertNoConflict(
  supabase: SupabaseClient,
  orgId: string,
  v: ParsedLesson,
  excludeLessonId?: string,
) {
  const { data: existing, error } = await supabase
    .from("lessons")
    .select("id, weekday, start_time, end_time, group_id, teacher_id, room_id")
    .eq("org_id", orgId)
    .in("weekday", v.weekdays);
  if (error) throw new ActionError("Darslarni tekshirib bo'lmadi: " + error.message);

  const start = timeToMinutes(v.startTime);
  const end = timeToMinutes(v.endTime);

  for (const lesson of (existing ?? []) as (ExistingLesson & { id: string })[]) {
    if (lesson.id === excludeLessonId) continue;
    const overlaps =
      start < timeToMinutes(lesson.end_time) && end > timeToMinutes(lesson.start_time);
    if (!overlaps) continue;

    const reason =
      lesson.group_id === v.groupId
        ? "Sinfda"
        : v.teacherId && lesson.teacher_id === v.teacherId
          ? "O'qituvchida"
          : v.roomId && lesson.room_id === v.roomId
            ? "Xonada"
            : null;
    if (reason) {
      throw new ActionError(
        `${HAFTA_KUNLARI[lesson.weekday - 1]} kuni ${reason} shu vaqtda boshqa dars bor`,
      );
    }
  }
}

export async function createLessons(input: LessonInput) {
  return runAction(async () => {
    const v = parseLesson(input);
    const { supabase, org } = await assertPermission("groups.manage");
    await assertNoConflict(supabase, org.id, v);

    const { error } = await supabase.from("lessons").insert(
      v.weekdays.map((weekday) => ({
        org_id: org.id,
        group_id: v.groupId,
        subject: v.subject,
        teacher_id: v.teacherId ?? null,
        room_id: v.roomId ?? null,
        weekday,
        start_time: v.startTime,
        end_time: v.endTime,
      })),
    );
    if (error) throw new ActionError("Darsni saqlab bo'lmadi: " + error.message);
    revalidatePath("/education/schedule");
  });
}

/** Bitta darsni (bitta kunni) yangilaydi; `weekdays` da aynan bitta kun bo'ladi. */
export async function updateLesson(lessonId: string, input: LessonInput) {
  return runAction(async () => {
    const v = parseLesson(input);
    if (v.weekdays.length !== 1) throw new ActionError("Tahrirlashda bitta kun tanlanadi");
    const { supabase, org } = await assertPermission("groups.manage");
    await assertNoConflict(supabase, org.id, v, lessonId);

    // RLS satrni yashirsa xato chiqmaydi — 0 satr yangilanadi, shuni tekshiramiz.
    const { data, error } = await supabase
      .from("lessons")
      .update({
        group_id: v.groupId,
        subject: v.subject,
        teacher_id: v.teacherId ?? null,
        room_id: v.roomId ?? null,
        weekday: v.weekdays[0],
        start_time: v.startTime,
        end_time: v.endTime,
      })
      .eq("id", lessonId)
      .select("id");
    if (error) throw new ActionError("Darsni yangilab bo'lmadi: " + error.message);
    if (!data?.length) throw new ActionError("Dars topilmadi yoki ruxsat yo'q");
    revalidatePath("/education/schedule");
  });
}

export async function deleteLesson(lessonId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("groups.manage");
    // RLS satrni yashirsa xato chiqmaydi — 0 satr o'chadi, shuni tekshiramiz.
    const { data, error } = await supabase.from("lessons").delete().eq("id", lessonId).select("id");
    if (error) throw new ActionError("Darsni o'chirib bo'lmadi: " + error.message);
    if (!data?.length) throw new ActionError("Dars topilmadi yoki ruxsat yo'q");
    revalidatePath("/education/schedule");
  });
}
