"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import { gradeBatchSchema, type GradeBatchInput } from "@/lib/validations/grade";

/** Bir sinf, bir fan va bir tur bo'yicha bir nechta o'quvchiga baho qo'yadi. */
export async function saveGrades(input: GradeBatchInput) {
  return runAction(async () => {
    const parsed = gradeBatchSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const { supabase, org } = await assertPermission("grades.manage");
    const v = parsed.data;

    const { data, error } = await supabase
      .from("grades")
      .insert(
        v.scores.map((s) => ({
          org_id: org.id,
          student_id: s.studentId,
          group_id: v.groupId,
          subject: v.subject,
          kind: v.kind,
          score: s.score,
          graded_on: v.gradedOn,
        })),
      )
      .select("id");
    if (error) throw new ActionError("Baholarni saqlab bo'lmadi: " + error.message);
    // RLS ruxsat bermasa xato emas, 0 satr qaytadi.
    if (!data?.length) throw new ActionError("Baholarni saqlash uchun ruxsat yo'q");

    revalidatePath("/education/grades");
    revalidatePath("/education/students");
    return { saved: data.length };
  });
}

export async function deleteGrade(gradeId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("grades.manage");
    const { data, error } = await supabase.from("grades").delete().eq("id", gradeId).select("id");
    if (error) throw new ActionError("Bahoni o'chirib bo'lmadi: " + error.message);
    if (!data?.length) throw new ActionError("Baho topilmadi yoki ruxsat yo'q");
    revalidatePath("/education/grades");
    revalidatePath("/education/students");
  });
}
