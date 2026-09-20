"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import { linkParentToStudent } from "@/lib/parents";
import { isLeadStage, leadSchema, type LeadInput, type LeadStage } from "@/lib/validations/lead";

function toLeadRow(input: LeadInput) {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
  }
  const v = parsed.data;
  return {
    full_name: v.fullName,
    parent_name: v.parentName,
    phone: v.phone,
    source: v.source,
    interest: v.interest,
    stage: v.stage,
    assigned_to: v.assignedTo,
    trial_date: v.trialDate,
    interest_level: v.interestLevel,
    next_contact_on: v.nextContactOn,
    note: v.note,
    student_id: v.studentId,
    referral_student_id: v.referralStudentId,
    lesson_days: v.lessonDays,
    lesson_time: v.lessonTime,
    teacher_id: v.teacherId,
    group_id: v.groupId,
    trial_time: v.trialTime,
  };
}

/** Yangi ustunlar (0054) bazada yo'q bo'lsa, foydalanuvchiga aniq yo'l ko'rsatiladi. */
function saveError(fallback: string, message: string): ActionError {
  return new ActionError(
    /column|schema cache/.test(message)
      ? "Yangi ustunlar bazada yo'q — 0054_lead_order_fields.sql migratsiyasini ishga tushiring"
      : fallback,
  );
}

export interface LeadFormOptions {
  students: { id: string; name: string; phone: string | null }[];
  courses: string[];
  teachers: { id: string; name: string }[];
  /** "Yig'ilayotgan guruh" — nabor (kutayotgan) holatidagi guruhlar. */
  groups: { id: string; name: string }[];
}

/** "Yangi buyurtma" oynasidagi tanlov ro'yxatlari. */
export async function getLeadFormOptions() {
  return runAction(async (): Promise<LeadFormOptions> => {
    const { supabase } = await assertPermission("leads.manage");
    const [students, courses, teachers, groups] = await Promise.all([
      supabase.from("students").select("id, full_name, phone").order("full_name"),
      supabase.from("courses").select("name").order("name"),
      supabase.from("teachers").select("id, full_name").order("full_name"),
      supabase.from("groups").select("id, name").eq("status", "waiting").order("name"),
    ]);
    return {
      students: ((students.data ?? []) as { id: string; full_name: string; phone: string | null }[]).map((s) => ({
        id: s.id,
        name: s.full_name,
        phone: s.phone,
      })),
      courses: ((courses.data ?? []) as { name: string }[]).map((c) => c.name),
      teachers: ((teachers.data ?? []) as { id: string; full_name: string }[]).map((t) => ({
        id: t.id,
        name: t.full_name,
      })),
      groups: (groups.data ?? []) as { id: string; name: string }[],
    };
  });
}

export async function createLead(input: LeadInput) {
  return runAction(async () => {
    const { supabase, org } = await assertPermission("leads.manage");

    // Buyurtma mavjud o'quvchiga bog'lanadi: ism va telefon o'quvchidan olinadi.
    let values = input;
    if (input.studentId) {
      const { data: student } = await supabase
        .from("students")
        .select("full_name, phone")
        .eq("id", input.studentId)
        .maybeSingle();
      if (!student) throw new ActionError("O'quvchi topilmadi");
      values = { ...input, fullName: student.full_name, phone: input.phone || student.phone || "" };
    }

    const { error } = await supabase.from("leads").insert({ org_id: org.id, ...toLeadRow(values) });
    if (error) throw saveError("Lidni saqlab bo'lmadi", error.message);
    revalidatePath("/leads");
  });
}

export async function updateLead(leadId: string, input: LeadInput) {
  return runAction(async () => {
    const { supabase } = await assertPermission("leads.manage");
    const { error } = await supabase.from("leads").update(toLeadRow(input)).eq("id", leadId);
    if (error) throw saveError("Lidni yangilab bo'lmadi", error.message);
    revalidatePath("/leads");
  });
}

export async function moveLead(leadId: string, stage: LeadStage) {
  return runAction(async () => {
    if (!isLeadStage(stage)) throw new ActionError("Noto'g'ri bosqich");
    const { supabase } = await assertPermission("leads.manage");
    // RLS satrni yashirsa PostgREST xato bermaydi — 0 ta satr qaytadi. Shuning
    // uchun yangilangan satrni so'raymiz, aks holda o'zgarish jimgina yo'qoladi.
    const { data, error } = await supabase
      .from("leads")
      .update({ stage })
      .eq("id", leadId)
      .select("id");
    if (error) throw new ActionError("Bosqichni o'zgartirib bo'lmadi");
    if (!data?.length) throw new ActionError("Lid topilmadi yoki ruxsat yo'q");
    revalidatePath("/leads");
  });
}

export async function deleteLead(leadId: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("leads.manage");
    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) throw new ActionError("Lidni o'chirib bo'lmadi");
    revalidatePath("/leads");
  });
}

/**
 * Lidni o'quvchilar bazasiga qo'shadi va "O'quvchi" bosqichiga o'tkazadi;
 * ota-ona ma'lumoti ota-onalar ro'yxatiga ham yoziladi. Qolgan hujjat
 * ma'lumotlari o'quvchi kartasida to'ldiriladi.
 */
export async function convertLeadToStudent(leadId: string) {
  return runAction(async () => {
    const { supabase, org } = await assertPermission("leads.manage");
    await assertPermission("students.manage");

    const { data: lead } = await supabase
      .from("leads")
      .select("full_name, parent_name, phone, student_id")
      .eq("id", leadId)
      .maybeSingle();
    if (!lead) throw new ActionError("Lid topilmadi");
    if (lead.student_id) return lead.student_id as string;

    const [lastName, ...rest] = lead.full_name.trim().split(/\s+/);
    const { data: student, error } = await supabase
      .from("students")
      .insert({
        org_id: org.id,
        full_name: lead.full_name,
        last_name: lastName,
        first_name: rest.join(" ") || null,
        parent_full_name: lead.parent_name,
        parent_phone: lead.phone,
      })
      .select("id")
      .single();
    if (error || !student) throw new ActionError("O'quvchini yaratib bo'lmadi");

    await supabase
      .from("leads")
      .update({ student_id: student.id, stage: "enrolled", next_contact_on: null })
      .eq("id", leadId);

    await linkParentToStudent(supabase, org.id, student.id as string, {
      fullName: lead.parent_name,
      phone: lead.phone,
    });

    revalidatePath("/leads");
    revalidatePath("/education/students");
    revalidatePath("/education/parents");
    return student.id as string;
  });
}
