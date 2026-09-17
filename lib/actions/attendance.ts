"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { notifyParent } from "@/lib/telegram/notify";
import { telegramTemplates } from "@/lib/telegram/templates";
import { formatDate } from "@/lib/utils/date";
import type { AttendanceStatus } from "@/types/database";

export interface AttendanceStudent {
  id: string;
  full_name: string;
  status: AttendanceStatus | null;
}

/** Guruh + sana bo'yicha o'quvchilar ro'yxati va ularning davomat holati. */
export async function getAttendanceForGroup(
  groupId: string,
  lessonDate: string,
): Promise<AttendanceStudent[]> {
  const { supabase } = await assertPermission("attendance.mark");

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("group_id", groupId)
    .eq("status", "active")
    .order("full_name");

  if (studentsError) throw new Error(studentsError.message);
  if (!students || students.length === 0) return [];

  const { data: records } = await supabase
    .from("attendance")
    .select("student_id, status")
    .eq("group_id", groupId)
    .eq("lesson_date", lessonDate);

  const statusByStudent = new Map(
    (records ?? []).map((r) => [r.student_id, r.status as AttendanceStatus]),
  );

  return students.map((s) => ({
    id: s.id,
    full_name: s.full_name,
    status: statusByStudent.get(s.id) ?? null,
  }));
}

/** Bitta o'quvchi uchun davomat belgisini qo'yadi/yangilaydi. */
export async function markAttendance(
  studentId: string,
  groupId: string,
  lessonDate: string,
  status: AttendanceStatus,
) {
  const { supabase } = await assertPermission("attendance.mark");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Avtorizatsiyadan o'tilmagan");

  const { error } = await supabase.from("attendance").upsert(
    {
      student_id: studentId,
      group_id: groupId,
      lesson_date: lessonDate,
      status,
      marked_by: user.id,
    },
    { onConflict: "student_id,lesson_date" },
  );

  if (error) {
    throw new Error("Davomatni saqlashda xatolik: " + error.message);
  }

  // Darsga kelmagan bo'lsa — ota-onaga Telegram orqali xabar.
  if (status === "absent") {
    const { data: student } = await supabase
      .from("students")
      .select("full_name, parent_telegram_chat_id")
      .eq("id", studentId)
      .maybeSingle();

    if (student) {
      await notifyParent(
        student.parent_telegram_chat_id,
        telegramTemplates.absent(student.full_name, formatDate(lessonDate)),
      );
    }
  }

  revalidatePath("/education/attendance");
}
