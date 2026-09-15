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
  educationType: z.enum(["offline", "online"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  lessonDurationMinutes: z
    .number({ message: "Davomiylik raqam bo'lishi kerak" })
    .int()
    .positive("Davomiylik musbat bo'lishi kerak")
    .optional(),
});

export type GroupInput = z.infer<typeof groupSchema>;

export const EDUCATION_TYPE_LABELS = {
  offline: "Oflayn",
  online: "Onlayn",
} as const;
