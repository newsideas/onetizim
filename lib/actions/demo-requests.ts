"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, runAction } from "@/lib/actions/result";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertPlatformAdmin } from "@/lib/auth/platform-admin";
import { normalizePhone } from "@/lib/auth/identity";

const requestSchema = z.object({
  centerName: z.string().trim().min(2, "Markaz nomini kiriting").max(120, "Markaz nomi juda uzun"),
  contactName: z.string().trim().min(2, "Ismingizni kiriting").max(120, "Ism juda uzun"),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizePhone(v) !== null, "Telefon raqamni to'g'ri kiriting (+998 90 123 45 67)"),
  comment: z.string().trim().max(500, "Izoh juda uzun").optional(),
  /** Yashirin maydon: odam ko'rmaydi, botlar to'ldiradi. */
  website: z.string().max(200).optional(),
});

export type DemoRequestInput = z.input<typeof requestSchema>;

/** Bir telefon soatiga shuncha arizadan ko'p yubora olmaydi. */
const MAX_PER_HOUR = 3;

/**
 * Ommaviy sayt formasi: kirish talab qilinmaydi. Yozuv service role bilan qo'shiladi (jadval RLS bilan yopiq),
 * shuning uchun kirishdagi ma'lumot qat'iy tekshiriladi va spamdan himoya qilinadi.
 */
export async function submitDemoRequest(input: DemoRequestInput) {
  return runAction(async () => {
    const parsed = requestSchema.safeParse(input);
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    const v = parsed.data;

    // Bot yashirin maydonni to'ldirgan: muvaffaqiyat ko'rsatamiz, lekin hech narsa saqlamaymiz.
    if (v.website) return { ok: true };

    const phone = normalizePhone(v.phone) as string;
    const admin = createAdminClient();

    const since = new Date(Date.now() - 3_600_000).toISOString();
    const { count } = await admin
      .from("demo_requests")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", since);
    if ((count ?? 0) >= MAX_PER_HOUR) throw new ActionError("Arizangiz qabul qilingan. Tez orada bog'lanamiz.");

    const { error } = await admin.from("demo_requests").insert({
      center_name: v.centerName,
      contact_name: v.contactName,
      phone,
      comment: v.comment || null,
    });
    if (error) throw new ActionError("Arizani yuborib bo'lmadi. Iltimos, keyinroq urinib ko'ring.");
    return { ok: true };
  });
}

const statusSchema = z.enum(["new", "contacted", "opened", "rejected"]);

/** Super admin: ariza holatini o'zgartiradi (yangi → bog'landim → markaz ochildi / rad). */
export async function setDemoRequestStatus(requestId: string, status: string) {
  return runAction(async () => {
    const id = z.string().uuid().safeParse(requestId);
    const st = statusSchema.safeParse(status);
    if (!id.success || !st.success) throw new ActionError("Ma'lumotlar noto'g'ri");

    const { supabase } = await assertPlatformAdmin();
    const { error } = await supabase.from("demo_requests").update({ status: st.data }).eq("id", id.data);
    if (error) throw new ActionError("Holatni o'zgartirib bo'lmadi: " + error.message);
    revalidatePath("/admin", "layout");
  });
}
