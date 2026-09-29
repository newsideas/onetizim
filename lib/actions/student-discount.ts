"use server";

import { revalidatePath } from "next/cache";
import { ActionError, runAction } from "@/lib/actions/result";
import { assertPermission } from "@/lib/auth/session";

/** O'quvchining chegirma foizi va sababini saqlaydi (keyingi oylik hisobdan boshlab qo'llanadi). */
export async function setStudentDiscount(studentId: string, percent: number, reason: string | null) {
  return runAction(async () => {
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      throw new ActionError("Chegirma 0 dan 100 foizgacha bo'lishi kerak");
    }
    const cleanReason = percent > 0 ? (reason?.trim().slice(0, 60) || null) : null;
    if (percent > 0 && !cleanReason) throw new ActionError("Chegirma sababini tanlang");

    const { supabase, org } = await assertPermission("payments.manage");
    const { data, error } = await supabase
      .from("students")
      .update({ discount_percent: percent, discount_reason: cleanReason })
      .eq("id", studentId)
      .eq("org_id", org.id)
      .select("id")
      .maybeSingle();

    if (error) {
      if (/discount_percent|discount_reason/.test(error.message)) {
        throw new ActionError("Chegirma ustunlari bazada yo'q — 0076_student_discounts.sql migratsiyasini ishga tushiring.");
      }
      throw new ActionError("Saqlashda xatolik: " + error.message);
    }
    if (!data) throw new ActionError("O'quvchi topilmadi");

    revalidatePath(`/education/students/${studentId}`);
    revalidatePath("/reports/discounts");
  });
}
