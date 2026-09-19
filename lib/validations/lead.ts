import { z } from "zod";

/** Xususiy maktab qabul voronkasi. */
export const LEAD_STAGES = [
  "new",
  "contacted",
  "visit",
  "test",
  "accepted",
  "contract",
  "paid",
  "enrolled",
  "lost",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new: "Yangi",
  contacted: "Bog'lanildi",
  visit: "Maktabga tashrif",
  test: "Test",
  accepted: "Qabul qilindi",
  contract: "Shartnoma",
  paid: "To'lov",
  enrolled: "O'quvchi",
  lost: "Rad etildi",
};

/** Qabul jarayoni tugagan bosqichlar — "bugun bog'lanish kerak" hisobiga kirmaydi. */
export const CLOSED_LEAD_STAGES: readonly LeadStage[] = ["enrolled", "lost"];

export const INTEREST_LEVELS = ["cold", "warm", "hot"] as const;
export type InterestLevel = (typeof INTEREST_LEVELS)[number];

export const INTEREST_LEVEL_LABELS: Record<InterestLevel, string> = {
  cold: "Sovuq",
  warm: "Iliq",
  hot: "Qizg'in",
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
  fullName: z.string().trim().min(2, "Bolaning ism familiyasini kiriting").max(120, "Ism juda uzun"),
  parentName: optionalText(120),
  phone: optionalText(30),
  source: optionalText(60),
  interest: optionalText(120),
  stage: z.enum(LEAD_STAGES, { message: "Bosqichni tanlang" }),
  assignedTo: optionalText(36),
  trialDate: optionalText(10),
  interestLevel: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.enum(INTEREST_LEVELS, { message: "Qiziqish darajasi noto'g'ri" }).nullable()),
  nextContactOn: optionalText(10),
  note: optionalText(2000),
});

export type LeadInput = z.input<typeof leadSchema>;

export function isLeadStage(value: string): value is LeadStage {
  return (LEAD_STAGES as readonly string[]).includes(value);
}
