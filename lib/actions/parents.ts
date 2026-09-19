"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import { parentSchema, type ParentInput } from "@/lib/validations/parent";

function parse(input: ParentInput) {
  const parsed = parentSchema.safeParse(input);
  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
  }
  return parsed.data;
}

function revalidateParents() {
  revalidatePath("/education/parents");
  revalidatePath("/education/students");
}

export async function createParent(input: ParentInput) {
  return runAction(async () => {
    const v = parse(input);
    const { supabase, org } = await assertPermission("students.manage");

    const { data, error } = await supabase
      .from("parents")
      .insert({
        org_id: org.id,
        full_name: v.fullName,
        relation: v.relation,
        phone: v.phone,
        note: v.note,
      })
      .select("id")
      .single();
    if (error) throw new ActionError("Ota-onani saqlab bo'lmadi: " + error.message);

    if (v.studentIds.length > 0) {
      const { error: linkError } = await supabase
        .from("student_parents")
        .insert(v.studentIds.map((studentId) => ({ student_id: studentId, parent_id: data.id })));
      if (linkError) throw new ActionError("Farzandlarni bog'lab bo'lmadi: " + linkError.message);
    }
    revalidateParents();
  });
}

/** Ma'lumotlarni yangilaydi va farzandlar ro'yxatini to'liq almashtiradi. */
export async function updateParent(parentId: string, input: ParentInput) {
  return runAction(async () => {
    const v = parse(input);
    const { supabase } = await assertPermission("students.manage");

    // RLS satrni yashirsa xato chiqmaydi — 0 satr yangilanadi, shuni tekshiramiz.
    const { data, error } = await supabase
      .from("parents")
      .update({ full_name: v.fullName, relation: v.relation, phone: v.phone, note: v.note })
      .eq("id", parentId)
      .select("id");
    if (error) throw new ActionError("Ota-onani yangilab bo'lmadi: " + error.message);
    if (!data?.length) throw new ActionError("Ota-ona topilmadi yoki ruxsat yo'q");

    const { error: clearError } = await supabase
      .from("student_parents")
      .delete()
      .eq("parent_id", parentId);
    if (clearError) throw new ActionError("Farzandlarni yangilab bo'lmadi: " + clearError.message);

    if (v.studentIds.length > 0) {
      const { error: linkError } = await supabase
        .from("student_parents")
        .insert(v.studentIds.map((studentId) => ({ student_id: studentId, parent_id: parentId })));
      if (linkError) throw new ActionError("Farzandlarni bog'lab bo'lmadi: " + linkError.message);
    }
    revalidateParents();
  });
}

export async function deleteParent(parentId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("students.manage");
    const { data, error } = await supabase.from("parents").delete().eq("id", parentId).select("id");
    if (error) throw new ActionError("Ota-onani o'chirib bo'lmadi: " + error.message);
    if (!data?.length) throw new ActionError("Ota-ona topilmadi yoki ruxsat yo'q");
    revalidateParents();
  });
}
