import { z } from "zod";
import { isValidSlug } from "@/lib/tenant";
import { normalizePhone } from "@/lib/auth/identity";

export const loginSchema = z.object({
  /** Telefon raqam, login yoki (eski hisoblar uchun) email. */
  identifier: z.string().trim().min(3, "Telefon raqam yoki loginni kiriting"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

export type LoginInput = z.infer<typeof loginSchema>;

const optionalText = z.string().trim().optional();

/**
 * Super admin yangi o'quv markaz ochganda kiritiladigan ma'lumotlar: nom, rahbar F.I.Sh, telefon va joylashuv.
 * Parol avtomatik yaratiladi, subdomen esa keyin markaz sahifasida belgilanadi.
 */
export const createCenterSchema = z.object({
  orgName: z.string().trim().min(2, "Markaz nomini kiriting").max(120, "Markaz nomi juda uzun"),
  directorName: z
    .string()
    .trim()
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, "Rahbarning familiyasi va ismini kiriting")
    .refine((v) => v.length <= 120, "Ism juda uzun"),
  // Direktorning telefoni tizimga kirish logini bo'ladi.
  phone: z
    .string()
    .trim()
    .refine((v) => normalizePhone(v) !== null, "Telefon raqamni to'g'ri kiriting (+998 90 123 45 67)"),
  location: optionalText,
});

export type CreateCenterInput = z.infer<typeof createCenterSchema>;

/** Markaz subdomeni (renessans.edugram.uz): super admin markaz sahifasida belgilaydi. */
export const subdomainSchema = z
  .string()
  .trim()
  .transform((v) => v.toLowerCase())
  .refine(isValidSlug, "Manzil 3–32 ta harf, raqam yoki chiziqchadan iborat bo'lsin");

