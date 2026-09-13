import { z } from "zod";

export const groupSchema = z.object({
  name: z.string().min(2, "Guruh nomi kamida 2 ta belgidan iborat bo'lishi kerak"),
  subject: z.string().optional(),
  teacherName: z.string().optional(),
  room: z.string().optional(),
  scheduleDays: z.array(z.string()).min(1, "Kamida bitta kun tanlang"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  monthlyPrice: z
    .number({ message: "Narx raqam bo'lishi kerak" })
    .min(0, "Narx manfiy bo'lishi mumkin emas"),
});

export type GroupInput = z.infer<typeof groupSchema>;
