import { z } from "zod";

export const studentSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: z.string().optional(),
  groupId: z.string().min(1, "Guruhni tanlang"),
});

export type StudentInput = z.infer<typeof studentSchema>;

/**
 * O'quvchi holatlari:
 * - active    — o'qiyapti, oylik hisob yoziladi, davomatda chiqadi
 * - frozen    — vaqtincha to'xtatilgan (ta'til, kasallik). Hisob yozilmaydi,
 *               lekin o'quvchi yo'qolmaydi — keyin qaytariladi
 * - archived  — o'qishni tugatgan/ketgan
 */
export const STUDENT_STATUS_LABELS = {
  active: "Aktiv",
  frozen: "Muzlatilgan",
  archived: "Arxiv",
} as const;

export const STUDENT_STATUS_CLASSES = {
  active: "bg-green-500/10 text-green-400",
  frozen: "bg-amber-500/10 text-amber-400",
  archived: "bg-white/5 text-white/50",
} as const;
