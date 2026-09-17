import { z } from "zod";
import { METHOD_LABELS } from "@/lib/validations/payment";

export const PAYMENT_METHODS = Object.keys(METHOD_LABELS) as (keyof typeof METHOD_LABELS)[];

/** "Xarajat turi" maydoni uchun tavsiyalar — erkin matn ham kiritiladi. */
export const EXPENSE_CATEGORIES = [
  "Ijara",
  "Kommunal to'lovlar",
  "Internet va aloqa",
  "Reklama",
  "O'quv qurollari",
  "Xo'jalik mollari",
  "Ta'mirlash",
  "Soliq",
  "Boshqa",
];

const methodSchema = z.enum(["naqd", "karta", "click", "payme"], {
  message: "To'lov usulini tanlang",
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sanani tanlang");

const optionalNote = z
  .string()
  .max(500, "Izoh juda uzun")
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : null));

export const expenseSchema = z.object({
  amount: z.number({ message: "Summani kiriting" }).positive("Summa musbat bo'lishi kerak"),
  category: z.string().trim().min(2, "Xarajat turini kiriting").max(80, "Matn juda uzun"),
  method: methodSchema,
  spentAt: isoDate,
  note: optionalNote,
});

export type ExpenseInput = z.input<typeof expenseSchema>;

export const salaryPayoutSchema = z.object({
  employeeId: z.string().uuid("Xodimni tanlang"),
  period: z.string().regex(/^\d{4}-\d{2}-01$/, "Oyni tanlang"),
  amount: z.number({ message: "Summani kiriting" }).positive("Summa musbat bo'lishi kerak"),
  method: methodSchema,
  paidAt: isoDate,
  note: optionalNote,
});

export type SalaryPayoutInput = z.input<typeof salaryPayoutSchema>;

export const SALARY_TYPE_LABELS: Record<string, string> = {
  fixed: "Qat'iy oylik",
  per_lesson: "Darsbay",
  percent: "Foiz",
};
