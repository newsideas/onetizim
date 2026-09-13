import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email noto'g'ri kiritildi"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  orgName: z
    .string()
    .min(2, "Tashkilot nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  orgType: z.enum(["togarak", "maktab"], {
    message: "Tashkilot turini tanlang",
  }),
  email: z.string().email("Email noto'g'ri kiritildi"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
