"use server";

import { ActionError, runAction } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";
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
export async function chargeMonthlyFees(period: string) {
  return runAction(async () => {
    const { supabase, org } = await assertPermission("payments.manage");

    const { data, error } = await supabase.rpc("charge_monthly_fees", {
      p_period: period,
    });

    if (error) {
      throw new ActionError("Oylik hisobni yopishda xatolik: " + error.message);
    }

    const inserted = (data as number) ?? 0;

    // Yangi hisob yozilgan bo'lsa — qarzdorlarning ota-onasiga xabar.
    if (inserted > 0) {
      const { data: debtors } = await supabase
        .from("students")
        .select("id, full_name, balance, parent_telegram_chat_id")
        .lt("balance", 0)
        .not("parent_telegram_chat_id", "is", null);

      for (const debtor of debtors ?? []) {
        await notifyParent(supabase, {
          chatId: debtor.parent_telegram_chat_id,
          text: telegramTemplates.qarzdorlik(debtor.full_name, debtor.balance),
          orgId: org.id,
          studentId: debtor.id,
          kind: "debt",
        });
      }
    }

    revalidatePath("/finance/payments");
    revalidatePath("/education/students");

    return inserted;
  });
}
