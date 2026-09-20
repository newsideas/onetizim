import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .max(max, "Matn juda uzun")
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null));

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sanani tanlang");

/** Edu tizimdagi "Yangi kassa qo'shish" oynasi: ism, moderator, onlayn to'lov va arxiv belgisi. */
export const cashboxSchema = z.object({
  name: z.string().trim().min(2, "Kassa nomini kiriting").max(80, "Nom juda uzun"),
  moderatorId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.string().uuid("Moderator noto'g'ri").nullable()),
  acceptsOnline: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export type CashboxInput = z.input<typeof cashboxSchema>;

/** "Ko'chirish" oynasi: bir kassadan boshqasiga pul o'tkazish. */
export const transferSchema = z
  .object({
    fromCashboxId: z.string().uuid("Kassani tanlang"),
    toCashboxId: z.string().uuid("Moliya bo'limini tanlang"),
    amount: z.number({ message: "Summani kiriting" }).positive("Summa musbat bo'lishi kerak"),
    method: z.enum(["naqd", "karta", "click", "payme", "terminal"], { message: "To'lov turini tanlang" }),
    date: isoDate,
    note: optionalText(500),
  })
  .refine((v) => v.fromCashboxId !== v.toCashboxId, {
    message: "Bir xil kassaga ko'chirib bo'lmaydi",
    path: ["toCashboxId"],
  });

export type TransferInput = z.input<typeof transferSchema>;
