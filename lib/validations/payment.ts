import { z } from "zod";

/** To'lov usullarining o'zbekcha nomlari (UI uchun). */
export const METHOD_LABELS = {
  naqd: "Naqd",
  karta: "Karta",
  click: "Click",
  payme: "Payme",
} as const;

export const paymentSchema = z.object({
  studentId: z.string().min(1, "O'quvchini tanlang"),
  amount: z
    .number({ message: "Summani kiriting" })
    .positive("Summa musbat bo'lishi kerak"),
  method: z.enum(["naqd", "karta", "click", "payme"], {
    message: "To'lov usulini tanlang",
  }),
  paidAt: z.string().min(1, "Sanani tanlang"),
  note: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
