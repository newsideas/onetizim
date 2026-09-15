import { z } from "zod";

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
