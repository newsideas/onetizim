"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPermission } from "@/lib/auth/session";
import { ActionError, runAction } from "@/lib/actions/result";

const courseSchema = z.object({
  title: z.string().trim().min(2, "Kurs nomini kiriting").max(120, "Kurs nomi juda uzun"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Rang noto'g'ri"),
  prices: z.array(
    z.object({
      branchId: z.string().min(1),
      available: z.boolean(),
      price: z.number({ message: "Narx raqam bo'lishi kerak" }).min(0, "Narx manfiy bo'lishi mumkin emas"),
    }),
  ),
});

export type CourseInput = z.infer<typeof courseSchema>;

/**
 * Kursni yaratadi (courseId yo'q) yoki yangilaydi. Kurs nomi, rangi va filiallar bo'yicha
 * "bitta dars narxi" saqlanadi (Edu tizimdagi kurs formasi).
 */
export async function saveCourse(courseId: string | null, input: CourseInput) {
  return runAction(async () => {
    const parsed = courseSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const { title, color, prices } = parsed.data;

    const { supabase, org } = await assertPermission("settings.manage");

    let id = courseId;
    if (id) {
      const { data, error } = await supabase
        .from("courses")
        .update({ name: title, color })
        .eq("id", id)
        .select("id");
      if (error) throw new ActionError(duplicateOr("Kursni yangilab bo'lmadi", error.message));
      if (!data?.length) throw new ActionError("Kurs topilmadi yoki ruxsat yo'q");
    } else {
      const { data, error } = await supabase
        .from("courses")
        .insert({ org_id: org.id, name: title, color })
        .select("id")
        .single();
      if (error) throw new ActionError(duplicateOr("Kursni saqlab bo'lmadi", error.message));
      id = data.id as string;
    }

    if (prices.length > 0) {
      const { error } = await supabase.from("course_branch_prices").upsert(
        prices.map((p) => ({
          org_id: org.id,
          course_id: id,
          branch_id: p.branchId,
          available: p.available,
          price: p.price,
        })),
        { onConflict: "course_id,branch_id" },
      );
      if (error) {
        throw new ActionError(
          error.message.includes("course_branch_prices")
            ? "Kurs saqlandi, lekin narxlar jadvali yo'q — 0053_course_branch_prices.sql migratsiyasini ishga tushiring"
            : "Narxlarni saqlab bo'lmadi: " + error.message,
        );
      }
    }

    revalidatePath("/settings/references/subjects");
    revalidatePath("/education/groups");
    return id;
  });
}

function duplicateOr(prefix: string, message: string): string {
  return /duplicate|unique/i.test(message) ? "Bunday nomli kurs allaqachon mavjud" : `${prefix}: ${message}`;
}
