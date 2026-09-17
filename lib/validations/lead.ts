import { z } from "zod";

export const LEAD_STAGES = ["new", "trial", "thinking", "contract", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: "Murojaat",
  trial: "Sinov darsi",
  thinking: "O'ylashmoqda",
  contract: "Shartnoma",
  lost: "Rad etildi",
};

/** Formadagi "Manba" maydoni uchun tavsiyalar — erkin matn ham kiritiladi. */
export const LEAD_SOURCES = [
  "Instagram",
  "Telegram",
  "Facebook",
  "Tavsiya",
  "Veb-sayt",
  "Qo'ng'iroq",
  "Tashrif",
  "Banner",
];

const optionalText = (max: number) =>
  z
    .string()
    .max(max, "Matn juda uzun")
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null));

export const leadSchema = z.object({
  fullName: z.string().trim().min(2, "Ism familiyani kiriting").max(120, "Ism juda uzun"),
  phone: optionalText(30),
  source: optionalText(60),
  interest: optionalText(120),
  stage: z.enum(LEAD_STAGES, { message: "Bosqichni tanlang" }),
  assignedTo: optionalText(36),
  trialDate: optionalText(10),
  note: optionalText(2000),
});

export type LeadInput = z.input<typeof leadSchema>;

export function isLeadStage(value: string): value is LeadStage {
  return (LEAD_STAGES as readonly string[]).includes(value);
}
