"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import { homeworkSchema, type HomeworkInput } from "@/lib/validations/homework";

function revalidateHomework() {
  revalidatePath("/education/homework");
  revalidatePath("/cabinet");
}

export async function createHomework(input: HomeworkInput) {
  return runAction(async () => {
    const parsed = homeworkSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const { supabase, org } = await assertPermission("homework.manage");
    const v = parsed.data;

    const { data, error } = await supabase
      .from("homework")
      .insert({
        org_id: org.id,
        group_id: v.groupId,
        subject: v.subject,
        title: v.title,
        details: v.details,
        due_on: v.dueOn,
        max_score: v.maxScore,
      })
      .select("id");
    if (error) throw new ActionError("Vazifani saqlab bo'lmadi: " + error.message);
    // RLS ruxsat bermasa xato emas, 0 satr qaytadi.
    if (!data?.length) throw new ActionError("Bu sinfga vazifa berish uchun ruxsat yo'q");
    revalidateHomework();
  });
}

export async function deleteHomework(homeworkId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("homework.manage");
    const { data, error } = await supabase.from("homework").delete().eq("id", homeworkId).select("id");
    if (error) throw new ActionError("Vazifani o'chirib bo'lmadi: " + error.message);
    if (!data?.length) throw new ActionError("Vazifa topilmadi yoki ruxsat yo'q");
    revalidateHomework();
  });
}
