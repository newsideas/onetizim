import { z } from "zod";

export const GRADE_KINDS = ["homework", "quiz", "midterm", "exam", "final"] as const;
export type GradeKind = (typeof GRADE_KINDS)[number];

export const GRADE_KIND_LABELS: Record<GradeKind, string> = {
  homework: "Uy vazifasi",
  quiz: "Nazorat",
  midterm: "Oraliq",
  exam: "Imtihon",
  final: "Yakuniy",
};

/** 5 ballik tizim. */
export const GRADE_SCORES = [5, 4, 3, 2, 1] as const;

export const gradeBatchSchema = z.object({
  groupId: z.string().uuid("Sinfni tanlang"),
  subject: z.string().trim().min(2, "Fan nomini kiriting").max(80, "Fan nomi juda uzun"),
  kind: z.enum(GRADE_KINDS, { message: "Baho turini tanlang" }),
  gradedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sanani tanlang"),
  scores: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        score: z.number().int().min(1, "Baho 1 dan 5 gacha").max(5, "Baho 1 dan 5 gacha"),
      }),
    )
    .min(1, "Kamida bitta o'quvchiga baho qo'ying")
    .max(300),
});

export type GradeBatchInput = z.input<typeof gradeBatchSchema>;

/** O'rtacha baho, bir kasr aniqlikda; baho bo'lmasa null. */
export function averageScore(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}
