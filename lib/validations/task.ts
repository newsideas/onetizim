import { z } from "zod";

export const TASK_TYPES = ["call", "meeting", "message", "payment", "other"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  call: "Qo'ng'iroq",
  meeting: "Uchrashuv",
  message: "Xabar yuborish",
  payment: "To'lovni eslatish",
  other: "Boshqa",
};

export const taskSchema = z.object({
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sanani tanlang"),
  dueTime: z
    .string()
    .nullish()
    .transform((v) => (v && /^\d{2}:\d{2}$/.test(v) ? v : null)),
  taskType: z.enum(TASK_TYPES, { message: "Topshiriq turini tanlang" }),
  assigneeId: z
    .string()
    .nullish()
    .transform((v) => v || null)
    .pipe(z.string().uuid("Xodim noto'g'ri").nullable()),
  note: z
    .string()
    .max(1000, "Izoh juda uzun")
    .nullish()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
});

export type TaskInput = z.input<typeof taskSchema>;
