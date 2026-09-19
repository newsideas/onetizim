"use server";

import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import { isLeadStage, leadSchema, type LeadInput, type LeadStage } from "@/lib/validations/lead";

function toLeadRow(input: LeadInput) {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
  }
  const v = parsed.data;
  return {
    full_name: v.fullName,
    phone: v.phone,
    source: v.source,
    interest: v.interest,
    stage: v.stage,
    assigned_to: v.assignedTo,
    trial_date: v.trialDate,
    note: v.note,
  };
}

export async function createLead(input: LeadInput) {
  return runAction(async () => {
    const { supabase, org } = await assertPermission("leads.manage");
    const { error } = await supabase.from("leads").insert({ org_id: org.id, ...toLeadRow(input) });
    if (error) throw new ActionError("Lidni saqlab bo'lmadi");
    revalidatePath("/leads");
  });
}

export async function updateLead(leadId: string, input: LeadInput) {
  return runAction(async () => {
    const { supabase } = await assertPermission("leads.manage");
    const { error } = await supabase.from("leads").update(toLeadRow(input)).eq("id", leadId);
    if (error) throw new ActionError("Lidni yangilab bo'lmadi");
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
 * Lidni o'quvchilar bazasiga qo'shadi va "Shartnoma" bosqichiga o'tkazadi.
 * Qolgan hujjat ma'lumotlari o'quvchi kartasida to'ldiriladi.
 */
export async function convertLeadToStudent(leadId: string) {
  return runAction(async () => {
    const { supabase, org } = await assertPermission("leads.manage");
    await assertPermission("students.manage");

    const { data: lead } = await supabase
      .from("leads")
      .select("full_name, phone, student_id")
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
        phone: lead.phone,
      })
      .select("id")
      .single();
    if (error || !student) throw new ActionError("O'quvchini yaratib bo'lmadi");

    await supabase
      .from("leads")
      .update({ student_id: student.id, stage: "contract" })
      .eq("id", leadId);

    revalidatePath("/leads");
    revalidatePath("/education/students");
    return student.id as string;
  });
}
