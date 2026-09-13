"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

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
  const supabase = await createClient();
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

  // TODO: 9-bosqich — status === "absent" bo'lsa, ota-onaga Telegram
  // orqali avtomatik xabar yuborish (lib/telegram/sendMessage.ts).

  revalidatePath("/attendance");
}
