import { z } from "zod";
import { ROLES } from "@/lib/auth/permissions";

export const TEACHER_KINDS = ["teacher", "manager", "admin"] as const;
export type TeacherKind = (typeof TEACHER_KINDS)[number];

export const TEACHER_KIND_LABELS: Record<TeacherKind, string> = {
  teacher: "O'qituvchi",
  manager: "Moderator",
  admin: "Ma'muriyat",
};

export const SALARY_TYPES = ["fixed", "per_lesson", "percent"] as const;

export const GENDERS = ["Erkak", "Ayol"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .max(max, "Matn juda uzun")
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null));

export const teacherSchema = z.object({
  fullName: z.string().trim().min(2, "Ism familiyani kiriting").max(120, "Ism juda uzun"),
  phone: optionalText(30),
  position: optionalText(80),
  kind: z.enum(TEACHER_KINDS, { message: "Toifani tanlang" }),
  salaryType: z.enum(SALARY_TYPES).optional().nullable(),
  rate: z
    .number()
    .nonnegative("Stavka manfiy bo'lishi mumkin emas")
    .optional()
    .nullable(),

  // Edu tizimdagi "Xodim qo'shish" maydonlari (0055_teacher_details.sql)
  gender: z.union([z.enum(GENDERS), z.literal("")]).optional(),
  birthDate: optionalText(10),
  paysSalary: z.boolean().optional(),
  workScheduleId: optionalText(36),
  comment: optionalText(500),
  email: z.union([z.string().trim().email("Elektron pochta noto'g'ri"), z.literal("")]).optional(),
  /** Xodim ishlaydigan filiallar (0072). */
  branchIds: z.array(z.string().uuid()).optional(),
});

/** Xodim ketganda tanlanadigan tayyor sabablar. */
export const STAFF_LEAVE_REASONS = ["Shaxsiy sabab", "Boshqa ishga o'tdi", "Ish haqi mos kelmadi", "Ishdan bo'shatildi", "Boshqa"] as const;

export type TeacherInput = z.input<typeof teacherSchema>;

/** Tayinlanadigan rollar: direktordan past hammasi. */
export const INVITABLE_ROLES = ROLES.filter((r) => r !== "owner");

/** Direktor / o'quv menejeri xodimga login va parol beradi. */
export const staffAccountSchema = z.object({
  fullName: z.string().trim().min(2, "Ism familiyani kiriting").max(120, "Ism juda uzun"),
  /** Telefon raqam yoki login (masalan: aziz.karimov). */
  login: z.string().trim().min(3, "Login yoki telefon raqamni kiriting").max(40, "Login juda uzun"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak").max(72, "Parol juda uzun"),
  role: z.enum(["manager", "teacher", "accountant"], { message: "Rolni tanlang" }),
  employeeId: z
    .string()
    .nullish()
    .transform((v) => v || null),
});

export type StaffAccountInput = z.input<typeof staffAccountSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak").max(72, "Parol juda uzun"),
});

export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
