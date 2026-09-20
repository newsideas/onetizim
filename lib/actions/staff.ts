"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import { isRole, type Role } from "@/lib/auth/permissions";
import { teacherSchema, type TeacherInput } from "@/lib/validations/staff";

function revalidateStaff() {
  revalidatePath("/staff");
  revalidatePath("/staff/access");
}

function toTeacherRow(input: TeacherInput) {
  const parsed = teacherSchema.safeParse(input);
  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
  }
  const v = parsed.data;
  return {
    full_name: v.fullName,
    phone: v.phone,
    position: v.position,
    kind: v.kind,
    salary_type: v.salaryType ?? null,
    rate: v.rate ?? null,
    gender: v.gender || null,
    birth_date: v.birthDate,
    pays_salary: v.paysSalary ?? true,
    work_schedule_id: v.workScheduleId,
    comment: v.comment,
    email: v.email?.trim() || null,
  };
}

/** "Xodim qo'shish" oynasidagi ish jadvallari ro'yxati. */
export async function getTeacherFormOptions() {
  return runAction(async () => {
    const { supabase } = await assertPermission("staff.manage");
    const { data } = await supabase.from("work_schedules").select("id, name").order("name");
    return (data ?? []) as { id: string; name: string }[];
  });
}

export async function createTeacher(input: TeacherInput) {
  return runAction(async () => {
    const { supabase, org } = await assertPermission("staff.manage");
    const { error } = await supabase.from("teachers").insert({ org_id: org.id, ...toTeacherRow(input) });
    if (error) throw new ActionError("Xodimni saqlab bo'lmadi: " + error.message);
    revalidateStaff();
  });
}

export async function updateTeacher(teacherId: string, input: TeacherInput) {
  return runAction(async () => {
    const { supabase } = await assertPermission("staff.manage");
    const { error } = await supabase.from("teachers").update(toTeacherRow(input)).eq("id", teacherId);
    if (error) throw new ActionError("Xodimni yangilab bo'lmadi: " + error.message);
    revalidateStaff();
  });
}

export async function setTeacherActive(teacherId: string, isActive: boolean) {
  return runAction(async () => {
    const { supabase } = await assertPermission("staff.manage");
    const { error } = await supabase
      .from("teachers")
      .update({ is_active: isActive })
      .eq("id", teacherId);
    if (error) throw new ActionError("Holatni o'zgartirib bo'lmadi: " + error.message);
    revalidateStaff();
  });
}

export async function deleteTeacher(teacherId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("staff.manage");
    const { error } = await supabase.from("teachers").delete().eq("id", teacherId);
    if (error) {
      // 23503 — guruh yoki oylik to'lovi bog'langan: o'chirib bo'lmaydi.
      throw new ActionError(
        error.code === "23503"
          ? "Bu xodim guruh yoki oylik to'lovlarga bog'langani uchun o'chirib bo'lmaydi — buning o'rniga \"Nofaol\" qiling"
          : "Xodimni o'chirib bo'lmadi: " + error.message,
      );
    }
    revalidateStaff();
  });
}

export async function updateMemberRole(userId: string, role: Role) {
  return runAction(async () => {
    if (!isRole(role) || role === "owner") throw new ActionError("Noto'g'ri rol");
    const { supabase } = await assertPermission("staff.manage");

    const { data: member } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (member?.role === "owner") {
      throw new ActionError("Tashkilot egasining rolini o'zgartirib bo'lmaydi");
    }

    const { error } = await supabase.from("org_members").update({ role }).eq("user_id", userId);
    if (error) throw new ActionError("Rolni o'zgartirib bo'lmadi: " + error.message);
    // Tayyor rol tanlansa, oldingi maxsus rol olib tashlanadi (0063 qo'llanmagan bo'lsa xato e'tiborsiz).
    await supabase.from("org_members").update({ custom_role_id: null }).eq("user_id", userId);
    revalidateStaff();
  });
}

export async function removeMember(userId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("staff.manage");

    const { data: member } = await supabase
      .from("org_members")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (member?.role === "owner") {
      throw new ActionError("Tashkilot egasining kirishini bekor qilib bo'lmaydi");
    }

    const { error } = await supabase.from("org_members").delete().eq("user_id", userId);
    if (error) throw new ActionError("Kirishni bekor qilib bo'lmadi: " + error.message);
    revalidateStaff();
  });
}
