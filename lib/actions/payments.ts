"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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

  // TODO: 9-bosqich — to'lov qabul qilinganda ota-onaga Telegram orqali
  // xabar yuborish (lib/telegram/templates.ts -> tolovQabulQilindi).

  revalidatePath("/payments");
  revalidatePath("/students");
}
