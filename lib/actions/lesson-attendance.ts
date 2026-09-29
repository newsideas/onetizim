"use server";

import { revalidatePath } from "next/cache";
import { ActionError, runAction } from "@/lib/actions/result";
import type { AttendanceStudent } from "@/lib/actions/attendance";
import { assertPermission } from "@/lib/auth/session";
import { notifyParent } from "@/lib/telegram/notify";
import { telegramTemplates } from "@/lib/telegram/templates";
import { HAFTA_KUNLARI, formatDate, todayIso } from "@/lib/utils/date";
import type { AttendanceStatus } from "@/types/database";

const STATUSES: AttendanceStatus[] = ["present", "absent", "late"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** 1 = Dushanba ... 7 = Yakshanba (lessons.weekday bilan bir xil). */
function weekdayOfIso(iso: string): number {
  return ((new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;
}

type Supa = Awaited<ReturnType<typeof assertPermission>>["supabase"];

async function loadLesson(supabase: Supa, orgId: string, lessonId: string) {
  const { data } = await supabase
    .from("lessons")
    .select("id, org_id, group_id, subject, weekday")
    .eq("id", lessonId)
    .maybeSingle();
  if (!data || data.org_id !== orgId) throw new ActionError("Dars topilmadi");
  return data as { id: string; org_id: string; group_id: string; subject: string; weekday: number };
}

function assertDate(lessonDate: string, weekday: number, anyDate: boolean) {
  if (!ISO_DATE.test(lessonDate)) throw new ActionError("Sana noto'g'ri");
  // O'qituvchi faqat bugungi darsga belgilaydi; boshqa kunlar — alohida ruxsat bilan (direktor/o'quv bo'limi).
  if (lessonDate !== todayIso() && !anyDate) {
    throw new ActionError("Davomatni faqat bugungi kunga belgilash mumkin. Boshqa kun uchun administratorga murojaat qiling.");
  }
  if (weekdayOfIso(lessonDate) !== weekday) {
    throw new ActionError(`Bu dars ${HAFTA_KUNLARI[weekday - 1]} kuni o'tiladi — tanlangan sanada dars yo'q.`);
  }
}

function saveError(error: { code?: string; message: string }): never {
  if (error.code === "42P01" || error.code === "PGRST205") {
    throw new ActionError("Fan bo'yicha davomat jadvali bazada yo'q — 0075_lesson_attendance.sql migratsiyasini ishga tushiring.");
  }
  if (error.code === "42501") throw new ActionError("Bu darsga davomat qilish huquqingiz yo'q");
  throw new ActionError("Davomatni saqlashda xatolik: " + error.message);
}

/** Dars (fan soati) + sana bo'yicha sinf o'quvchilari va ularning davomat holati. */
export async function getLessonAttendance(lessonId: string, lessonDate: string): Promise<AttendanceStudent[]> {
  const { supabase, org } = await assertPermission("attendance.mark");
  const lesson = await loadLesson(supabase, org.id, lessonId);

  const [{ data: students, error }, { data: records }] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name")
      .eq("group_id", lesson.group_id)
      .eq("status", "active")
      .order("full_name"),
    supabase
      .from("lesson_attendance")
      .select("student_id, status, reason")
      .eq("lesson_id", lessonId)
      .eq("lesson_date", lessonDate),
  ]);
  if (error) throw new ActionError(error.message);

  const byStudent = new Map(
    ((records ?? []) as { student_id: string; status: AttendanceStatus; reason: string | null }[]).map((r) => [
      r.student_id,
      r,
    ]),
  );
  return (students ?? []).map((s) => ({
    id: s.id as string,
    full_name: s.full_name as string,
    status: byStudent.get(s.id as string)?.status ?? null,
    reason: byStudent.get(s.id as string)?.reason ?? null,
  }));
}

/** Bitta o'quvchi uchun shu darsdagi davomat belgisini qo'yadi/yangilaydi. */
export async function markLessonAttendance(
  lessonId: string,
  studentId: string,
  lessonDate: string,
  status: AttendanceStatus,
  reason?: string | null,
) {
  return runAction(async () => {
    if (!STATUSES.includes(status)) throw new ActionError("Holat noto'g'ri");
    const { supabase, org, permissions } = await assertPermission("attendance.mark");
    const lesson = await loadLesson(supabase, org.id, lessonId);
    assertDate(lessonDate, lesson.weekday, permissions.includes("attendance.any_date"));

    // Ota-onaga kuniga bitta xabar: shu kuni avval qoldirilgan dars bo'lsa qayta yuborilmaydi.
    const { data: absentToday } = await supabase
      .from("lesson_attendance")
      .select("lesson_id")
      .eq("student_id", studentId)
      .eq("lesson_date", lessonDate)
      .eq("status", "absent");

    const { error } = await supabase.from("lesson_attendance").upsert(
      {
        org_id: org.id,
        lesson_id: lesson.id,
        group_id: lesson.group_id,
        student_id: studentId,
        lesson_date: lessonDate,
        status,
        reason: status === "absent" && reason ? reason.slice(0, 120) : null,
      },
      { onConflict: "lesson_id,student_id,lesson_date" },
    );
    if (error) saveError(error);

    if (status === "absent" && (absentToday ?? []).length === 0) {
      const { data: student } = await supabase
        .from("students")
        .select("full_name, parent_telegram_chat_id")
        .eq("id", studentId)
        .maybeSingle();
      if (student) {
        await notifyParent(supabase, {
          chatId: student.parent_telegram_chat_id,
          text: telegramTemplates.absentLesson(student.full_name, formatDate(lessonDate), lesson.subject),
          orgId: org.id,
          studentId,
          kind: "absent",
        });
      }
    }

    revalidatePath("/education/attendance");
  });
}

/** Belgilanmagan o'quvchilarning hammasini "Keldi" deb belgilaydi (mavjud belgilar o'zgarmaydi). */
export async function markLessonAllPresent(lessonId: string, lessonDate: string) {
  return runAction(async () => {
    const { supabase, org, permissions } = await assertPermission("attendance.mark");
    const lesson = await loadLesson(supabase, org.id, lessonId);
    assertDate(lessonDate, lesson.weekday, permissions.includes("attendance.any_date"));

    const [{ data: students }, { data: records }] = await Promise.all([
      supabase.from("students").select("id").eq("group_id", lesson.group_id).eq("status", "active"),
      supabase.from("lesson_attendance").select("student_id").eq("lesson_id", lessonId).eq("lesson_date", lessonDate),
    ]);
    const marked = new Set((records ?? []).map((r) => r.student_id as string));
    const rows = (students ?? [])
      .filter((s) => !marked.has(s.id as string))
      .map((s) => ({
        org_id: org.id,
        lesson_id: lesson.id,
        group_id: lesson.group_id,
        student_id: s.id as string,
        lesson_date: lessonDate,
        status: "present" as const,
        reason: null,
      }));
    if (rows.length === 0) return 0;

    const { error } = await supabase
      .from("lesson_attendance")
      .upsert(rows, { onConflict: "lesson_id,student_id,lesson_date", ignoreDuplicates: true });
    if (error) saveError(error);
    revalidatePath("/education/attendance");
    return rows.length;
  });
}
