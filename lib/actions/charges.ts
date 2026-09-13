"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Berilgan oy uchun barcha aktiv o'quvchilarga oylik hisobni yozadi
 * (guruhning monthly_price'i balansdan ayiriladi).
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

  revalidatePath("/payments");
  revalidatePath("/students");

  return (data as number) ?? 0;
}
