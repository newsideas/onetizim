import { z } from "zod";
import { isValidSlug } from "@/lib/tenant";

export const loginSchema = z.object({
  email: z.string().email("Email noto'g'ri kiritildi"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

export type LoginInput = z.infer<typeof loginSchema>;

const optionalText = z.string().trim().optional();

export const registerSchema = z.object({
  // Muassasa ma'lumotlari
  orgName: z.string().trim().min(2, "Muassasa nomini kiriting"),
  orgType: z.enum(["maktab", "bogcha", "markaz"], {
    message: "Muassasa turini tanlang",
  }),
  orgSlug: z
    .string()
    .trim()
    .transform((v) => v.toLowerCase())
    .refine(isValidSlug, "Manzil 3–32 ta harf, raqam yoki chiziqchadan iborat bo'lsin"),
  tin: optionalText,
  region: z.string().trim().min(1, "Viloyatni tanlang"),
  district: z.string().trim().min(2, "Tuman yoki shaharni kiriting"),
  address: optionalText,

  // Rahbar ma'lumotlari
  directorLastName: z.string().trim().min(2, "Familiyani kiriting"),
  directorFirstName: z.string().trim().min(2, "Ismni kiriting"),
  phone: z.string().trim().min(9, "Telefon raqamini kiriting"),

  // Hisob
  email: z.string().email("Email noto'g'ri kiritildi"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),

  // Shartlar
  acceptTerms: z.literal(true, {
    message: "Foydalanish shartlarini qabul qiling",
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const inviteSignupSchema = z.object({
  fullName: z.string().trim().min(3, "Familiya va ismingizni kiriting"),
  email: z.string().email("Email noto'g'ri kiritildi"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

export type InviteSignupInput = z.infer<typeof inviteSignupSchema>;

export const createOrganizationSchema = z.object({
  orgName: z.string().trim().min(2, "Muassasa nomini kiriting"),
  orgType: z.enum(["maktab", "bogcha", "markaz"], { message: "Muassasa turini tanlang" }),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
