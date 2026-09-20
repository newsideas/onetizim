"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";
import { referencePath } from "@/lib/references";

const time = z.string().regex(/^\d{2}:\d{2}$/, "Vaqt noto'g'ri");

/** Bir kun: "off" (dam olish) yoki ish vaqtlari (boshlanish, tugash, kelish, tanaffus). */
const daySchema = z.union([
  z.literal("off"),
  z.object({
    s: time.optional(),
    e: time.optional(),
    a: time.optional(),
    bs: time.optional(),
    be: time.optional(),
  }),
]);

const scheduleSchema = z.object({
  name: z.string().trim().min(2, "Jadval nomini kiriting").max(120, "Nom juda uzun"),
  year: z.number().int().min(2000, "Yilni tanlang").max(2100, "Yilni tanlang"),
  code: z.string().trim().max(40, "Kod juda uzun").optional(),
  days: z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), daySchema),
});

export type WorkScheduleInput = z.input<typeof scheduleSchema>;

/**
 * Ish jadvalini yaratadi yoki yangilaydi. Ustunlar 0066 migratsiyasi bilan qo'shiladi;
 * qo'llanmagan bo'lsa tushunarli xabar qaytariladi.
 */
export async function saveWorkSchedule(scheduleId: string | null, input: WorkScheduleInput) {
  return runAction(async () => {
    const parsed = scheduleSchema.safeParse(input);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    const v = parsed.data;

    const { supabase, org } = await assertPermission("settings.manage");
    const row = { name: v.name, year: v.year, code: v.code || null, days: v.days };

    const { error } = scheduleId
      ? await supabase.from("work_schedules").update(row).eq("id", scheduleId)
      : await supabase.from("work_schedules").insert({ org_id: org.id, ...row });

    if (error) {
      throw new ActionError(
        /column|schema cache/i.test(error.message)
          ? "Ish jadvali ustunlari hali sozlanmagan — 0066 migratsiyasini Supabase SQL Editor'da ishga tushiring"
          : "Saqlashda xatolik: " + error.message,
      );
    }
    revalidatePath(referencePath("work-schedules"));
  });
}
