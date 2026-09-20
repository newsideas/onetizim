"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import { taskSchema, type TaskInput } from "@/lib/validations/task";

function row(v: ReturnType<typeof taskSchema.parse>) {
  return {
    due_date: v.dueDate,
    due_time: v.dueTime,
    task_type: v.taskType,
    assignee_id: v.assigneeId,
    note: v.note,
  };
}

export async function createTask(input: TaskInput) {
  return runAction(async () => {
    const parsed = taskSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const { supabase, org } = await assertPermission("leads.manage");
    const { error } = await supabase.from("tasks").insert({ org_id: org.id, ...row(parsed.data) });
    if (error) throw new ActionError("Topshiriqni saqlab bo'lmadi: " + error.message);
    revalidatePath("/tasks");
  });
}

export async function updateTask(taskId: string, input: TaskInput) {
  return runAction(async () => {
    const parsed = taskSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const { supabase } = await assertPermission("leads.manage");
    // RLS faqat o'z tashkilotidagi topshiriqni o'zgartirishga ruxsat beradi; 0 satr — ruxsat yo'q yoki topilmadi.
    const { data, error } = await supabase
      .from("tasks")
      .update(row(parsed.data))
      .eq("id", taskId)
      .select("id");
    if (error) throw new ActionError("Topshiriqni yangilab bo'lmadi: " + error.message);
    if (!data?.length) throw new ActionError("Topshiriq topilmadi yoki ruxsat yo'q");
    revalidatePath("/tasks");
  });
}

/** Bajarildi deb belgilash yoki qaytarish. */
export async function setTaskDone(taskId: string, done: boolean) {
  return runAction(async () => {
    const { supabase } = await assertPermission("leads.manage");
    const { data, error } = await supabase
      .from("tasks")
      .update({ done_at: done ? new Date().toISOString() : null })
      .eq("id", taskId)
      .select("id");
    if (error) throw new ActionError("Holatni o'zgartirib bo'lmadi: " + error.message);
    if (!data?.length) throw new ActionError("Topshiriq topilmadi yoki ruxsat yo'q");
    revalidatePath("/tasks");
  });
}

export async function deleteTask(taskId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("leads.manage");
    const { data, error } = await supabase.from("tasks").delete().eq("id", taskId).select("id");
    if (error) throw new ActionError("Topshiriqni o'chirib bo'lmadi: " + error.message);
    if (!data?.length) throw new ActionError("Topshiriq topilmadi yoki ruxsat yo'q");
    revalidatePath("/tasks");
  });
}
