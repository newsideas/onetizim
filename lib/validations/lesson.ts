import { z } from "zod";

const time = z.string().regex(/^\d{2}:\d{2}$/, "Vaqtni kiriting");

/** Bo'sh satr (tanlanmagan <select>) undefined ga aylanadi. */
const optionalId = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined))
  .pipe(z.string().uuid().optional());

export const lessonSchema = z
  .object({
    groupId: z.string().uuid("Sinfni tanlang"),
    subject: z.string().trim().min(2, "Fan nomini kiriting").max(80, "Fan nomi juda uzun"),
    teacherId: optionalId,
    roomId: optionalId,
    weekdays: z
      .array(z.number().int().min(1).max(7))
      .min(1, "Kamida bitta kunni tanlang"),
    startTime: time,
    endTime: time,
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "Tugash vaqti boshlanishdan keyin bo'lishi kerak",
    path: ["endTime"],
  });

export type LessonInput = z.input<typeof lessonSchema>;
