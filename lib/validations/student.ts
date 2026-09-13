import { z } from "zod";

export const studentSchema = z.object({
  fullName: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  phone: z.string().optional(),
  groupId: z.string().min(1, "Guruhni tanlang"),
});

export type StudentInput = z.infer<typeof studentSchema>;
