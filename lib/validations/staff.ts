import { z } from "zod";
import { ROLES } from "@/lib/auth/permissions";

export const TEACHER_KINDS = ["teacher", "manager", "admin"] as const;
export type TeacherKind = (typeof TEACHER_KINDS)[number];

export const TEACHER_KIND_LABELS: Record<TeacherKind, string> = {
  teacher: "O'qituvchi",
  manager: "Menejer",
  admin: "Ma'muriyat",
};

export const SALARY_TYPES = ["fixed", "per_lesson", "percent"] as const;

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
});

export type TeacherInput = z.input<typeof teacherSchema>;

/** Taklif faqat direktordan past rollarga beriladi. */
export const INVITABLE_ROLES = ROLES.filter((r) => r !== "owner");

export const inviteSchema = z.object({
  fullName: z.string().trim().min(2, "Ism familiyani kiriting").max(120, "Ism juda uzun"),
  role: z.enum(["manager", "teacher"], { message: "Rolni tanlang" }),
  employeeId: optionalText(36),
});

export type InviteInput = z.input<typeof inviteSchema>;
