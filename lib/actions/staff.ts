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

/** Filiallar (0072) ustuni bo'lmagan bazada saqlash buzilmasligi uchun alohida qo'shiladi. */
function branchColumns(input: TeacherInput) {
  return input.branchIds ? { branch_ids: input.branchIds } : {};
}

function missingBranchColumn(message: string) {
  return /branch_ids/.test(message);
}

/** "Xodim qo'shish" oynasidagi ish jadvallari va filiallar ro'yxati. */
export async function getTeacherFormOptions() {
  return runAction(async () => {
    const { supabase } = await assertPermission("staff.manage");
    const [schedules, branches] = await Promise.all([
      supabase.from("work_schedules").select("id, name").order("name"),
      supabase.from("branches").select("id, name").order("name"),
    ]);
    return {
      schedules: (schedules.data ?? []) as { id: string; name: string }[],
      branches: (branches.data ?? []) as { id: string; name: string }[],
    };
  });
}

export async function createTeacher(input: TeacherInput) {
  return runAction(async () => {
    const { supabase, org } = await assertPermission("staff.manage");
    const row = { org_id: org.id, ...toTeacherRow(input) };
    let { error } = await supabase.from("teachers").insert({ ...row, ...branchColumns(input) });
    if (error && missingBranchColumn(error.message)) ({ error } = await supabase.from("teachers").insert(row));
    if (error) throw new ActionError("Xodimni saqlab bo'lmadi: " + error.message);
    revalidateStaff();
  });
}

export async function updateTeacher(teacherId: string, input: TeacherInput) {
  return runAction(async () => {
    const { supabase } = await assertPermission("staff.manage");
    const row = toTeacherRow(input);
    let { error } = await supabase.from("teachers").update({ ...row, ...branchColumns(input) }).eq("id", teacherId);
    if (error && missingBranchColumn(error.message)) ({ error } = await supabase.from("teachers").update(row).eq("id", teacherId));
    if (error) throw new ActionError("Xodimni yangilab bo'lmadi: " + error.message);
    revalidateStaff();
  });
}

/** Xodimni faol/nofaol qiladi; nofaol qilinganda ketish sanasi va sababi yoziladi (0072). */
export async function setTeacherActive(
  teacherId: string,
  isActive: boolean,
  leave?: { date: string; reason: string },
) {
  return runAction(async () => {
    const { supabase } = await assertPermission("staff.manage");
    const leaveColumns = isActive
      ? { left_on: null, leave_reason: null }
      : { left_on: leave?.date || null, leave_reason: leave?.reason?.slice(0, 120) || null };
    let { error } = await supabase
      .from("teachers")
      .update({ is_active: isActive, ...leaveColumns })
      .eq("id", teacherId);
    // 0072 qo'llanmagan bo'lsa faqat holatning o'zi o'zgaradi.
    if (error && /left_on|leave_reason/.test(error.message)) {
      ({ error } = await supabase.from("teachers").update({ is_active: isActive }).eq("id", teacherId));
    }
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
