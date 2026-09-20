import { z } from "zod";

export const homeworkSchema = z.object({
  groupId: z.string().uuid("Sinfni tanlang"),
  subject: z.string().trim().min(2, "Fan nomini kiriting").max(80, "Fan nomi juda uzun"),
  title: z.string().trim().min(2, "Vazifa mavzusini kiriting").max(150, "Mavzu juda uzun"),
  details: z
    .string()
    .max(2000, "Izoh juda uzun")
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  maxScore: z
    .number({ message: "Maksimal ball raqam bo'lishi kerak" })
    .int("Maksimal ball butun son bo'lishi kerak")
    .positive("Maksimal ball musbat bo'lishi kerak")
    .max(1000, "Maksimal ball juda katta")
    .nullish()
    .transform((v) => v ?? null),
  dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Topshirish sanasini tanlang"),
});

export type HomeworkInput = z.input<typeof homeworkSchema>;
