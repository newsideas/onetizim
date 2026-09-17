"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyParent } from "@/lib/telegram/notify";
import { telegramTemplates } from "@/lib/telegram/templates";
import { paymentSchema, type PaymentInput } from "@/lib/validations/payment";

export async function createPayment(input: PaymentInput) {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
  }
  const values = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.from("payments").insert({
    student_id: values.studentId,
    amount: values.amount,
    method: values.method,
    paid_at: values.paidAt,
    note: values.note || null,
  });

  if (error) {
    throw new Error("To'lovni saqlashda xatolik: " + error.message);
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
    await notifyParent(
      student.parent_telegram_chat_id,
      telegramTemplates.tolovQabulQilindi(student.full_name, values.amount),
    );
  }

  revalidatePath("/finance/payments");
  revalidatePath("/education/students");
}
