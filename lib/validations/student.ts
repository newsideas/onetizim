import { z } from "zod";

/** Ixtiyoriy matn maydoni: bo'sh satr null sifatida saqlanadi. */
const optionalText = z.string().trim().optional();

export const studentSchema = z.object({
  // Shaxsiy ma'lumotlar
  lastName: z.string().trim().min(2, "Familiyani kiriting"),
  firstName: z.string().trim().min(2, "Ismni kiriting"),
  middleName: optionalText,
  birthDate: optionalText,
  // <select> tanlanmaganda "" yuboradi — uni "ko'rsatilmagan" deb qabul qilamiz
  gender: z.union([z.enum(["erkak", "ayol"]), z.literal("")]).optional(),
  nationality: optionalText,

  // Tug'ilganlik haqida guvohnoma
  birthCertSeries: optionalText,
  birthCertNumber: optionalText,

  // Pasport
  passportNumber: optionalText,
  passportPinfl: optionalText,
  passportIssuedDate: optionalText,

  // Ota-ona yoki vasiy
  parentFullName: optionalText,
  parentRelation: optionalText,
  parentPassportNumber: optionalText,
  parentPinfl: optionalText,
  parentPassportIssuedDate: optionalText,
  parentPassportIssuedBy: optionalText,
  parentPhone: optionalText,

  // Manzil
  region: optionalText,
  district: optionalText,
  address: optionalText,

  // Tizim
  groupId: z.string().min(1, "Guruhni tanlang"),
  phone: optionalText,
});

export type StudentInput = z.infer<typeof studentSchema>;

export const GENDER_LABELS = {
  erkak: "Erkak",
  ayol: "Ayol",
} as const;

/** Ota-ona bilan qarindoshlik darajasi. */
export const RELATIONS = [
  "Otasi",
  "Onasi",
  "Bobosi",
  "Buvisi",
  "Akasi",
  "Opasi",
  "Vasiy",
] as const;

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
  active: "bg-green-50 text-green-700",
  frozen: "bg-amber-50 text-amber-700",
  archived: "bg-canvas text-ink-faint",
} as const;
