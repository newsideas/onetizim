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
