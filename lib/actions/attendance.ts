"use server";

import { ActionError, runAction } from "@/lib/actions/result";
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
  /** Kelmagan o'quvchi uchun sabab (0070); ustun bo'lmasa null. */
  reason: string | null;
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

  if (studentsError) throw new ActionError(studentsError.message);
  if (!students || students.length === 0) return [];

  // "reason" ustuni (0070) yo'q bo'lsa, sababsiz so'rovga qaytamiz.
  type AttendanceRecord = { student_id: string; status: string; reason?: string | null };
  const withReason = await supabase
    .from("attendance")
    .select("student_id, status, reason")
    .eq("group_id", groupId)
    .eq("lesson_date", lessonDate);
  const records: AttendanceRecord[] | null = withReason.error
    ? ((
        await supabase
          .from("attendance")
          .select("student_id, status")
          .eq("group_id", groupId)
          .eq("lesson_date", lessonDate)
      ).data as AttendanceRecord[] | null)
    : (withReason.data as AttendanceRecord[] | null);

  const byStudent = new Map(
    (records ?? []).map((r) => [
      r.student_id,
      { status: r.status as AttendanceStatus, reason: r.reason ?? null },
    ]),
  );

  return students.map((s) => ({
    id: s.id,
    full_name: s.full_name,
    status: byStudent.get(s.id)?.status ?? null,
    reason: byStudent.get(s.id)?.reason ?? null,
  }));
}

/** Bitta o'quvchi uchun davomat belgisini qo'yadi/yangilaydi. */
export async function markAttendance(
  studentId: string,
  groupId: string,
  lessonDate: string,
  status: AttendanceStatus,
  /** Kelmagan o'quvchi uchun sabab (ixtiyoriy). */
  reason?: string | null,
) {
  return runAction(async () => {
    const { supabase, org } = await assertPermission("attendance.mark");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new ActionError("Avtorizatsiyadan o'tilmagan");

    // Sabab keyin o'zgartirilganda ota-onaga takroriy xabar ketmasligi uchun avvalgi holat olinadi.
    const { data: existing } = await supabase
      .from("attendance")
      .select("status")
      .eq("student_id", studentId)
      .eq("lesson_date", lessonDate)
      .maybeSingle();
    const wasAbsent = existing?.status === "absent";

    const { error } = await supabase.from("attendance").upsert(
      {
        student_id: studentId,
        group_id: groupId,
        lesson_date: lessonDate,
        status,
        marked_by: user.id,
        // Faqat sabab berilganda yoziladi (0070 qo'llanmagan bazada oddiy belgilash buzilmasin).
        ...(status === "absent" && reason ? { reason: reason.slice(0, 120) } : {}),
      },
      { onConflict: "student_id,lesson_date" },
    );

    if (error) {
      throw new ActionError("Davomatni saqlashda xatolik: " + error.message);
    }

    // Kelgan/kechikkan deb o'zgartirilsa eski sabab tozalanadi (ustun bo'lmasa xato e'tiborsiz).
    if (status !== "absent") {
      await supabase.from("attendance").update({ reason: null }).eq("student_id", studentId).eq("lesson_date", lessonDate);
    }

    // Darsga kelmagan bo'lsa — ota-onaga Telegram orqali xabar.
    if (status === "absent" && !wasAbsent) {
      const { data: student } = await supabase
        .from("students")
        .select("full_name, parent_telegram_chat_id")
        .eq("id", studentId)
        .maybeSingle();

      if (student) {
        await notifyParent(supabase, {
          chatId: student.parent_telegram_chat_id,
          text: telegramTemplates.absent(student.full_name, formatDate(lessonDate)),
          orgId: org.id,
          studentId,
          kind: "absent",
        });
      }
    }

    revalidatePath("/education/attendance");
  });
}
