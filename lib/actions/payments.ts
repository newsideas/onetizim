"use server";

import { ActionError, runAction } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
import { notifyParent } from "@/lib/telegram/notify";
import { telegramTemplates } from "@/lib/telegram/templates";
import { paymentSchema, type PaymentInput } from "@/lib/validations/payment";

export async function createPayment(input: PaymentInput) {
  return runAction(async () => {
    const parsed = paymentSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const values = parsed.data;

    const { supabase, org } = await assertPermission("payments.manage");

    const { error } = await supabase.from("payments").insert({
      student_id: values.studentId,
      amount: values.amount,
      method: values.method,
      paid_at: values.paidAt,
      note: values.note || null,
      ...(values.cashboxId ? { cashbox_id: values.cashboxId } : {}),
    });

    if (error) {
      throw new ActionError("To'lovni saqlashda xatolik: " + error.message);
    }

    // students.balance 0004_payment_balance_trigger.sql dagi trigger orqali
    // avtomatik yangilanadi — bu yerda alohida update kerak emas.

    // Ota-onaga "to'lov qabul qilindi" xabari.
    const { data: student } = await supabase
      .from("students")
      .select("full_name, parent_telegram_chat_id")
      .eq("id", values.studentId)
      .maybeSingle();

    if (student) {
      await notifyParent(supabase, {
        chatId: student.parent_telegram_chat_id,
        text: telegramTemplates.tolovQabulQilindi(student.full_name, values.amount),
        orgId: org.id,
        studentId: values.studentId,
        kind: "payment",
      });
    }

    revalidatePath("/finance/payments");
    revalidatePath("/education/students");
  });
}

/**
 * To'lovni bekor qiladi: yozuv `cancelled_payments`ga ko'chiriladi va `payments`dan
 * o'chiriladi (0050 dagi trigger o'quvchi balansini qaytaradi).
 */
export async function cancelPayment(paymentId: string, reason?: string) {
  return runAction(async () => {
    const { supabase, org } = await assertPermission("payments.manage");

    const { data: payment } = await supabase
      .from("payments")
      .select("id, student_id, amount, method, paid_at, note, student:students(full_name)")
      .eq("id", paymentId)
      .maybeSingle();
    if (!payment) throw new ActionError("To'lov topilmadi");

    const student = payment.student as { full_name: string } | { full_name: string }[] | null;
    const studentName = Array.isArray(student) ? student[0]?.full_name : student?.full_name;

    const { data: archived, error: archiveError } = await supabase
      .from("cancelled_payments")
      .insert({
        org_id: org.id,
        student_id: payment.student_id,
        student_name: studentName ?? null,
        amount: payment.amount,
        method: payment.method,
        paid_at: payment.paid_at,
        note: payment.note,
        reason: reason?.trim().slice(0, 200) || null,
      })
      .select("id")
      .single();
    if (archiveError) {
      throw new ActionError(
        archiveError.message.includes("cancelled_payments")
          ? "Bekor qilish jadvali topilmadi — 0050 migratsiyasini ishga tushiring"
          : "To'lovni bekor qilishda xatolik: " + archiveError.message,
      );
    }

    const { error } = await supabase.from("payments").delete().eq("id", paymentId);
    if (error) {
      await supabase.from("cancelled_payments").delete().eq("id", archived.id);
      throw new ActionError("To'lovni bekor qilishda xatolik: " + error.message);
    }

    revalidatePath("/finance/payments");
    revalidatePath("/education/students");
    revalidatePath("/reports/cancelled-payments");
  });
}
