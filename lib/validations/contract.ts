import { z } from "zod";

export const CONTRACT_FILES_BUCKET = "contract-files";
export const CONTRACT_FILE_MAX_BYTES = 10 * 1024 * 1024;
export const CONTRACT_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ContractStatus = "active" | "cancelled";

const optionalText = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : null));

export const contractSchema = z.object({
  studentId: z.string().min(1, "O'quvchini tanlang"),
  contractNumber: optionalText.pipe(
    z.string().max(50, "Shartnoma raqami juda uzun").nullable(),
  ),
  contractTypeId: optionalText,
  academicYearId: optionalText,
  discountId: optionalText,
  baseAmount: z
    .number({ message: "Summani kiriting" })
    .nonnegative("Summa manfiy bo'lishi mumkin emas"),
  filePath: z.string().nullable().optional(),
  fileName: z.string().max(255).nullable().optional(),
});

export type ContractInput = z.input<typeof contractSchema>;

export interface DiscountRule {
  discount_type: string | null;
  amount: number;
}

/** Chegirma summasi — hech qachon asosiy summadan oshmaydi. */
export function calculateDiscount(baseAmount: number, discount: DiscountRule | null): number {
  if (!discount || baseAmount <= 0) return 0;
  const value = Number(discount.amount) || 0;
  const raw =
    discount.discount_type === "fixed" ? value : (baseAmount * Math.min(value, 100)) / 100;
  return Math.min(Math.max(Math.round(raw), 0), baseAmount);
}

export function contractFileError(file: File): string | null {
  if (!(CONTRACT_FILE_TYPES as readonly string[]).includes(file.type)) {
    return "Faqat PDF, JPG, PNG yoki WEBP fayl yuklash mumkin";
  }
  if (file.size > CONTRACT_FILE_MAX_BYTES) {
    return "Fayl hajmi 10 MB dan oshmasligi kerak";
  }
  return null;
}
