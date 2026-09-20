"use server";

import { ActionError, runAction } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import {
  newStudentSchema,
  studentSchema,
  type NewStudentInput,
  type StudentInput,
} from "@/lib/validations/student";
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

export interface StudentFormOptions {
  categories: { id: string; name: string }[];
  campaigns: { id: string; name: string }[];
  languages: string[];
}

/** "Yangi o'quvchi qo'shish" oynasidagi tanlov ro'yxatlari (kategoriya, marketing, o'qish tili). */
export async function getStudentFormOptions() {
  return runAction(async (): Promise<StudentFormOptions> => {
    const { supabase } = await assertPermission("students.manage");
    const [categories, campaigns, languages] = await Promise.all([
      supabase.from("course_categories").select("id, name").order("name"),
      supabase.from("marketing_campaigns").select("id, name").order("name"),
      supabase.from("academic_languages").select("name").order("name"),
    ]);
    return {
      categories: (categories.data ?? []) as { id: string; name: string }[],
      campaigns: (campaigns.data ?? []) as { id: string; name: string }[],
      languages: ((languages.data ?? []) as { name: string }[]).map((l) => l.name),
    };
  });
}

/** Edu tizimdagi "Yangi o'quvchi qo'shish" oynasi: faqat ism majburiy, guruh keyin biriktiriladi. */
export async function createStudentQuick(input: NewStudentInput) {
  return runAction(async () => {
    const parsed = newStudentSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const v = parsed.data;

    const { supabase, org } = await assertPermission("students.manage");

    const firstName = v.firstName.trim();
    const lastName = nullable(v.lastName);
    const { data, error } = await supabase
      .from("students")
      .insert({
        org_id: org.id,
        first_name: firstName,
        last_name: lastName,
        middle_name: nullable(v.fatherName),
        full_name: [lastName, firstName].filter(Boolean).join(" "),
        phone: nullable(v.phone),
        email: nullable(v.email),
        category_id: nullable(v.categoryId),
        birth_date: nullable(v.birthDate),
        payment_date: nullable(v.paymentDate),
        marketing_campaign_id: nullable(v.marketingCampaignId),
        study_language: nullable(v.studyLanguage),
        father_phone: nullable(v.fatherPhone),
        mother_name: nullable(v.motherName),
        mother_phone: nullable(v.motherPhone),
      })
      .select("id")
      .single();

    if (error) {
      throw new ActionError(
        /column|schema cache/.test(error.message)
          ? "Yangi ustunlar bazada yo'q — 0052_student_quick_fields.sql migratsiyasini ishga tushiring"
          : "Saqlashda xatolik: " + error.message,
      );
    }

    await linkParentToStudent(supabase, org.id, data.id as string, {
      fullName: nullable(v.motherName),
      phone: nullable(v.motherPhone),
      relation: "Onasi",
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
  /** Arxivlanganda ketish sababi (ixtiyoriy). */
  reason?: string,
) {
  return runAction(async () => {
    const { supabase } = await assertPermission("students.manage");

    const archiveReason = status === "archived" ? reason?.trim().slice(0, 200) : undefined;
    let { error } = await supabase
      .from("students")
      .update(archiveReason ? { status, archive_reason: archiveReason } : { status })
      .eq("id", studentId);

    // 0049 migratsiyasi hali qo'llanmagan bo'lsa sabab saqlanmaydi, lekin arxivlash ishlayveradi.
    if (error && archiveReason && error.message.includes("archive_reason")) {
      ({ error } = await supabase.from("students").update({ status }).eq("id", studentId));
    }

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
