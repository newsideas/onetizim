"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyParent } from "@/lib/telegram/notify";
import { telegramTemplates } from "@/lib/telegram/templates";

/**
 * Berilgan oy uchun barcha aktiv o'quvchilarga oylik hisobni yozadi
 * (guruhning monthly_price'i balansdan ayiriladi), so'ng qarzdor bo'lib
 * qolganlarning ota-onasiga Telegram orqali xabar yuboradi.
 *
 * Takroriy chaqirish xavfsiz: charges jadvalidagi unique (student_id,
 * period) tufayli allaqachon hisoblangan o'quvchi ikkinchi marta
 * hisoblanmaydi. Nechta yangi yozuv qo'shilgani qaytariladi.
 */
export async function chargeMonthlyFees(period: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("charge_monthly_fees", {
    p_period: period,
  });

  if (error) {
    throw new Error("Oylik hisobni yopishda xatolik: " + error.message);
  }

  const inserted = (data as number) ?? 0;

  // Yangi hisob yozilgan bo'lsa — qarzdorlarning ota-onasiga xabar.
  if (inserted > 0) {
    const { data: debtors } = await supabase
      .from("students")
      .select("full_name, balance, parent_telegram_chat_id")
      .lt("balance", 0)
      .not("parent_telegram_chat_id", "is", null);

    for (const debtor of debtors ?? []) {
      await notifyParent(
        debtor.parent_telegram_chat_id,
        telegramTemplates.qarzdorlik(debtor.full_name, debtor.balance),
      );
    }
  }

  revalidatePath("/finance/payments");
  revalidatePath("/education/students");

  return inserted;
}
