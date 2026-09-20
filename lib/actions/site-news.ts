"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, runAction } from "@/lib/actions/result";
import { assertPlatformAdmin } from "@/lib/auth/platform-admin";

const newsSchema = z.object({
  title: z.string().trim().min(3, "Sarlavhani kiriting").max(150, "Sarlavha juda uzun"),
  body: z.string().trim().max(2000, "Matn juda uzun").optional(),
});

export type SiteNewsInput = z.input<typeof newsSchema>;

function revalidateNews() {
  revalidatePath("/admin", "layout");
  revalidatePath("/");
  revalidatePath("/site");
}

/** Super admin: yangi yangilik yozadi (darhol saytda ko'rinadi). */
export async function createSiteNews(input: SiteNewsInput) {
  return runAction(async () => {
    const parsed = newsSchema.safeParse(input);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    const { supabase } = await assertPlatformAdmin();
    const { error } = await supabase.from("site_news").insert({ title: parsed.data.title, body: parsed.data.body || null });
    if (error) {
      throw new ActionError(
        /site_news|schema cache/.test(error.message)
          ? "Yangiliklar jadvali hali yo'q — 0071 migratsiyasini Supabase SQL Editor'da ishga tushiring"
          : "Saqlashda xatolik: " + error.message,
      );
    }
    revalidateNews();
  });
}

/** Yangilikni saytdan yashiradi yoki qayta ko'rsatadi. */
export async function setSiteNewsPublished(newsId: string, published: boolean) {
  return runAction(async () => {
    const id = z.string().uuid().safeParse(newsId);
    if (!id.success) throw new ActionError("Yangilik topilmadi");
    const { supabase } = await assertPlatformAdmin();
    const { error } = await supabase.from("site_news").update({ is_published: published }).eq("id", id.data);
    if (error) throw new ActionError("O'zgartirib bo'lmadi: " + error.message);
    revalidateNews();
  });
}

export async function deleteSiteNews(newsId: string) {
  return runAction(async () => {
    const id = z.string().uuid().safeParse(newsId);
    if (!id.success) throw new ActionError("Yangilik topilmadi");
    const { supabase } = await assertPlatformAdmin();
    const { error } = await supabase.from("site_news").delete().eq("id", id.data);
    if (error) throw new ActionError("O'chirib bo'lmadi: " + error.message);
    revalidateNews();
  });
}
