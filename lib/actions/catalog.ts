"use server";

import { ActionError, runAction } from "@/lib/actions/result";
import { revalidatePath } from "next/cache";
import { assertPermission } from "@/lib/auth/session";

type CatalogTable = "rooms" | "courses";

/** Xona yoki kursni qo'lda qo'shish (guruh formasida ham avtomatik yaratiladi). */
export async function createCatalogItem(table: CatalogTable, name: string) {
  return runAction(async () => {
    const trimmed = name.trim();
    if (trimmed.length < 1) throw new ActionError("Nom bo'sh bo'lishi mumkin emas");

    const { supabase, org } = await assertPermission("settings.manage");
    const orgId = org.id;

    const { error } = await supabase
      .from(table)
      .insert({ org_id: orgId, name: trimmed });

    if (error) {
      throw new ActionError(
        error.code === "23505"
          ? "Bu nom allaqachon mavjud"
          : "Saqlashda xatolik: " + error.message,
      );
    }

    revalidatePath("/settings");
  });
}

export async function renameCatalogItem(
  table: CatalogTable,
  id: string,
  name: string,
) {
  return runAction(async () => {
    const trimmed = name.trim();
    if (trimmed.length < 1) throw new ActionError("Nom bo'sh bo'lishi mumkin emas");

    const { supabase } = await assertPermission("settings.manage");
    const { error } = await supabase
      .from(table)
      .update({ name: trimmed })
      .eq("id", id);

    if (error) {
      throw new ActionError(
        error.code === "23505"
          ? "Bu nom allaqachon mavjud"
          : "Yangilashda xatolik: " + error.message,
      );
    }

    revalidatePath("/settings");
    revalidatePath("/education/groups");
    revalidatePath("/education/schedule");
  });
}

/**
 * O'chirish. Guruhlardagi bog'lanish "on delete set null" bo'lgani uchun
 * guruh o'chmaydi — faqat xona/kursi bo'sh qoladi.
 */
export async function deleteCatalogItem(table: CatalogTable, id: string) {
  return runAction(async () => {
    const { supabase } = await assertPermission("settings.manage");
    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) throw new ActionError("O'chirishda xatolik: " + error.message);

    revalidatePath("/settings");
    revalidatePath("/education/groups");
    revalidatePath("/education/schedule");
  });
}
