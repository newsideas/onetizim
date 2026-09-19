"use server";

import { ActionError, runAction } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { studentSchema, type StudentInput } from "@/lib/validations/student";
import type { StudentStatus } from "@/types/database";
import { linkParentToStudent } from "@/lib/parents";

/** Bo'sh satrni null'ga aylantiradi (bazada bo'sh matn saqlamaslik uchun). */
function nullable(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Forma qiymatlarini students jadvali ustunlariga moslashtiradi. */
function toStudentRow(values: StudentInput) {
  return {
    last_name: values.lastName.trim(),
    first_name: values.firstName.trim(),
    middle_name: nullable(values.middleName),
    birth_date: nullable(values.birthDate),
    gender: values.gender || null,
    nationality: nullable(values.nationality),

    birth_cert_series: nullable(values.birthCertSeries),
    birth_cert_number: nullable(values.birthCertNumber),

    passport_number: nullable(values.passportNumber),
    passport_pinfl: nullable(values.passportPinfl),
    passport_issued_date: nullable(values.passportIssuedDate),

    parent_full_name: nullable(values.parentFullName),
    parent_relation: nullable(values.parentRelation),
    parent_passport_number: nullable(values.parentPassportNumber),
    parent_pinfl: nullable(values.parentPinfl),
    parent_passport_issued_date: nullable(values.parentPassportIssuedDate),
    parent_passport_issued_by: nullable(values.parentPassportIssuedBy),
    parent_phone: nullable(values.parentPhone),

    region: nullable(values.region),
    district: nullable(values.district),
    address: nullable(values.address),

    group_id: values.groupId,
    phone: nullable(values.phone),

    // full_name bazadagi trigger orqali FISH maydonlaridan yig'iladi,
    // lekin NOT NULL bo'lgani uchun boshlang'ich qiymat beriladi.
    full_name: `${values.lastName.trim()} ${values.firstName.trim()}`,
  };
}

export async function createStudent(input: StudentInput) {
  return runAction(async () => {
    const parsed = studentSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }

    const { supabase, org } = await assertPermission("students.manage");
    const orgId = org.id;

    const { data, error } = await supabase
      .from("students")
      .insert({ org_id: orgId, ...toStudentRow(parsed.data) })
      .select("id")
      .single();

    if (error) {
      throw new ActionError("Saqlashda xatolik: " + error.message);
    }

    await linkParentToStudent(supabase, orgId, data.id as string, {
      fullName: nullable(parsed.data.parentFullName),
      phone: nullable(parsed.data.parentPhone),
      relation: nullable(parsed.data.parentRelation),
    });

    revalidatePath("/education/students");
    revalidatePath("/education/parents");
    return data.id as string;
  });
}

export async function updateStudent(studentId: string, input: StudentInput) {
  return runAction(async () => {
    const parsed = studentSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }

    const { supabase } = await assertPermission("students.manage");
    const { error } = await supabase
      .from("students")
      .update(toStudentRow(parsed.data))
      .eq("id", studentId);

    if (error) {
      throw new ActionError("Yangilashda xatolik: " + error.message);
    }

    revalidatePath("/education/students");
    revalidatePath(`/education/students/${studentId}`);
  });
}

/**
 * O'quvchi holatini o'zgartiradi (aktiv / muzlatilgan / arxiv).
 * Muzlatilgan va arxivlangan o'quvchiga oylik hisob yozilmaydi
 * (charge_monthly_fees faqat status = 'active' bo'lganlarni oladi).
 */
export async function updateStudentStatus(
  studentId: string,
  status: StudentStatus,
) {
  return runAction(async () => {
    const { supabase } = await assertPermission("students.manage");

    const { error } = await supabase
      .from("students")
      .update({ status })
      .eq("id", studentId);

    if (error) {
      throw new ActionError("Holatni o'zgartirishda xatolik: " + error.message);
    }

    revalidatePath("/education/students");
    revalidatePath(`/education/students/${studentId}`);
    revalidatePath("/education/attendance");
  });
}

/**
 * O'quvchini boshqa sinf/guruhga biriktiradi ("O'quvchini biriktirish"
 * sahifasi). To'liq formani ochmasdan tez o'zgartirish uchun — asosiy
 * tahrirlash `updateStudent` orqali ketadi.
 */
export async function assignStudentGroup(studentId: string, groupId: string) {
  return runAction(async () => {
    if (!groupId) throw new ActionError("Guruhni tanlang");

    const { supabase } = await assertPermission("students.manage");
    const { error } = await supabase
      .from("students")
      .update({ group_id: groupId })
      .eq("id", studentId);

    if (error) throw new ActionError("Biriktirishda xatolik: " + error.message);

    revalidatePath("/education/groups/assign");
    revalidatePath("/education/students");
    revalidatePath("/education/students/base");
    revalidatePath(`/education/students/${studentId}`);
  });
}
