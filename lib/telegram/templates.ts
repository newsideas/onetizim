import { formatSom } from "@/lib/utils/currency";

/** Ota-onaga yuboriladigan tayyor xabar shablonlari. */
export const telegramTemplates = {
  ulandi: (studentName: string) =>
    `✅ Bot ulandi!\n\n<b>${studentName}</b> haqidagi xabarlarni shu yerda olasiz: davomat va to'lov bo'yicha.`,

  oquvchiTopilmadi:
    "❌ O'quvchi topilmadi. Havola eskirgan bo'lishi mumkin — to'garak ma'muriyatidan yangi havola so'rang.",

  yordam:
    "Salom! Bu — to'garak xabarnomasi boti.\n\nFarzandingiz haqidagi xabarlarni olish uchun to'garak bergan maxsus havola orqali botni oching.",

  absent: (studentName: string, date: string) =>
    `⚠️ <b>${studentName}</b> bugun (${date}) darsga kelmadi.`,

  qarzdorlik: (studentName: string, balance: number) =>
    `💳 <b>${studentName}</b> uchun qarzdorlik: ${formatSom(Math.abs(balance))}.`,

  tolovQabulQilindi: (studentName: string, amount: number) =>
    `✅ <b>${studentName}</b> uchun ${formatSom(amount)} to'lov qabul qilindi. Rahmat!`,
};
