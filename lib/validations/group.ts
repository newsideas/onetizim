import { z } from "zod";

export const groupSchema = z.object({
  name: z.string().min(2, "Guruh nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  subject: z.string().optional(),
  teacherName: z.string().optional(),
  room: z.string().optional(),
  scheduleDays: z.array(z.string()),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  monthlyPrice: z
    .number({ message: "Narx raqam bo'lishi kerak" })
    .min(0, "Narx manfiy bo'lishi mumkin emas"),
  educationType: z.enum(["offline", "online"], { message: "Ta'lim turini tanlang" }),
  status: z.enum(["active", "waiting", "archived"], { message: "Guruh holatini tanlang" }),
  level: z.string().max(60, "Daraja nomi juda uzun").optional(),
  telegramUrl: z
    .string()
    .trim()
    .max(200, "Havola juda uzun")
    .refine(
      (v) => !v || /^(https?:\/\/|t\.me\/|@)/i.test(v),
      "Havola https:// yoki t.me/ bilan boshlanishi kerak",
    )
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  lessonDurationMinutes: z
    .number({ message: "Davomiylik raqam bo'lishi kerak" })
    .int()
    .positive("Davomiylik musbat bo'lishi kerak")
    .optional(),
});

export type GroupInput = z.infer<typeof groupSchema>;

export const GROUP_STATUS_LABELS = {
  active: "Aktiv",
  waiting: "Kutayotgan(nabor)",
  archived: "Arxiv",
} as const;

export type GroupStatus = keyof typeof GROUP_STATUS_LABELS;

export const EDUCATION_TYPE_LABELS = {
  offline: "Oflayn",
  online: "Onlayn",
} as const;
