import { z } from "zod";
import { RELATIONS } from "@/lib/validations/student";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "Matn juda uzun")
    .optional()
    .transform((v) => (v ? v : null));

export const parentSchema = z.object({
  fullName: z.string().trim().min(2, "F.I.Sh. ni kiriting").max(120, "F.I.Sh. juda uzun"),
  relation: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.enum(RELATIONS).nullable()),
  phone: optionalText(30),
  note: optionalText(500),
  studentIds: z.array(z.string().uuid()).max(30, "Juda ko'p farzand tanlangan"),
});

export type ParentInput = z.input<typeof parentSchema>;
