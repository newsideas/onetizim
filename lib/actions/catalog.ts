"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrgId } from "@/lib/supabase/getCurrentOrg";

type CatalogTable = "rooms" | "courses";

/** Xona yoki kursni qo'lda qo'shish (guruh formasida ham avtomatik yaratiladi). */
export async function createCatalogItem(table: CatalogTable, name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 1) throw new Error("Nom bo'sh bo'lishi mumkin emas");

  const supabase = await createClient();
  const orgId = await getCurrentOrgId(supabase);

  const { error } = await supabase
    .from(table)
    .insert({ org_id: orgId, name: trimmed });

  if (error) {
    throw new Error(
      error.code === "23505"
        ? "Bu nom allaqachon mavjud"
        : "Saqlashda xatolik: " + error.message,
    );
  }

  revalidatePath("/settings");
}

export async function renameCatalogItem(
  table: CatalogTable,
  id: string,
  name: string,
) {
  const trimmed = name.trim();
  if (trimmed.length < 1) throw new Error("Nom bo'sh bo'lishi mumkin emas");

  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ name: trimmed })
    .eq("id", id);

  if (error) {
    throw new Error(
      error.code === "23505"
        ? "Bu nom allaqachon mavjud"
        : "Yangilashda xatolik: " + error.message,
    );
  }

  revalidatePath("/settings");
  revalidatePath("/groups");
  revalidatePath("/schedule");
}

/**
 * O'chirish. Guruhlardagi bog'lanish "on delete set null" bo'lgani uchun
 * guruh o'chmaydi — faqat xona/kursi bo'sh qoladi.
 */
export async function deleteCatalogItem(table: CatalogTable, id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) throw new Error("O'chirishda xatolik: " + error.message);

  revalidatePath("/settings");
  revalidatePath("/groups");
  revalidatePath("/schedule");
}
