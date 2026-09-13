import { formatSom } from "@/lib/utils/currency";

/** Ota-onaga yuboriladigan tayyor xabar shablonlari. */
export const telegramTemplates = {
  absent: (studentName: string, date: string) =>
    `⚠️ <b>${studentName}</b> bugun (${date}) darsga kelmadi.`,

  qarzdorlik: (studentName: string, balance: number) =>
    `💳 <b>${studentName}</b> uchun qarzdorlik: ${formatSom(Math.abs(balance))}.`,

  tolovQabulQilindi: (studentName: string, amount: number) =>
    `✅ <b>${studentName}</b> uchun ${formatSom(amount)} to'lov qabul qilindi. Rahmat!`,
};
