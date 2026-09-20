"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ActionError, runAction } from "@/lib/actions/result";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertPlatformAdmin } from "@/lib/auth/platform-admin";
import { IDENTITY_DOMAIN, identityToEmail, normalizePhone } from "@/lib/auth/identity";
import { generatePassword } from "@/lib/auth/passwords";
import { createCenterSchema, subdomainSchema, type CreateCenterInput } from "@/lib/validations/auth";

/**
 * Super admin yangi o'quv markazni ochadi: nom, rahbar F.I.Sh, telefon va joylashuv kiritiladi.
 * Direktor hisobi (telefon + avtomatik parol), markaz va direktor a'zoligi bitta amalda yaratiladi.
 * Subdomen bu yerda berilmaydi — markaz sahifasida alohida belgilanadi (`setCenterSubdomain`).
 * Markaz yaratilmasa, hisob ham o'chiriladi (yetim hisob qolmasin).
 * Parol faqat shu javobda qaytadi: super admin uni direktorga o'zi yetkazadi.
 */
export async function createCenter(input: CreateCenterInput) {
  return runAction(async () => {
    await assertPlatformAdmin();

    const parsed = createCenterSchema.safeParse(input);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");
    }
    const v = parsed.data;

    const phone = normalizePhone(v.phone);
    // Subdomen berilmaguncha hisob vaqtinchalik ichki nom ostida turadi; subdomen belgilanganda ko'chiriladi.
    const email = phone ? identityToEmail(phone, `pending-${crypto.randomUUID().slice(0, 8)}`) : null;
    if (!phone || !email) throw new ActionError("Telefon raqamni to'g'ri kiriting");

    const [lastName, ...rest] = v.directorName.split(/\s+/).filter(Boolean);
    const firstName = rest.join(" ");
    const fullName = `${lastName} ${firstName}`.trim();
    const password = generatePassword(8);

    const admin = createAdminClient();

    const { data: created, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    });
    if (userError || !created.user) {
      throw new ActionError("Hisobni yaratib bo'lmadi: " + (userError?.message ?? "noma'lum xato"));
    }
    const userId = created.user.id;

    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({
        owner_id: userId,
        name: v.orgName,
        type: "markaz",
        address: v.location || null,
        director_last_name: lastName,
        director_first_name: firstName,
        phone,
      })
      .select("id")
      .single();
    if (orgError || !org) {
      await admin.auth.admin.deleteUser(userId);
      throw new ActionError("Markazni yaratib bo'lmadi: " + (orgError?.message ?? "noma'lum xato"));
    }

    // Edu tizimdagidek: markazning asosiy filiali markaz nomi bilan ochiladi (kurs narxlari shu filialga bog'lanadi).
    await admin.from("branches").insert({ org_id: org.id, name: v.orgName });
    // Asosiy kassa (0057); to'lov va xarajatlar shu kassaga tushadi.
    await admin.from("cashboxes").insert({ org_id: org.id, name: "Asosiy kassa" });

    // Direktor a'zoligi trigger orqali yaratiladi; login va ismni to'ldiramiz.
    await admin.from("org_members").update({ login: phone, full_name: fullName }).eq("user_id", userId);

    revalidatePath("/admin", "layout");
    return { orgId: org.id as string, name: v.orgName, phone, password };
  });
}

/**
 * Markaz subdomenini belgilaydi yoki o'zgartiradi (renessans.edugram.uz).
 * Markaz xodimlarining ichki kirish manzili subdomenga bog'liq, shuning uchun ularniki ham yangilanadi:
 * telefon/login va parollar o'zgarmaydi, faqat manzil ko'chadi.
 */
export async function setCenterSubdomain(orgId: string, slugInput: string) {
  return runAction(async () => {
    await assertPlatformAdmin();

    const id = z.string().uuid().safeParse(orgId);
    const slug = subdomainSchema.safeParse(slugInput);
    if (!id.success) throw new ActionError("Markaz topilmadi");
    if (!slug.success) throw new ActionError(slug.error.issues[0]?.message ?? "Manzil noto'g'ri");

    const admin = createAdminClient();
    const { data: org } = await admin.from("organizations").select("id, slug").eq("id", id.data).maybeSingle();
    if (!org) throw new ActionError("Markaz topilmadi");
    if (org.slug === slug.data) return { slug: slug.data };

    const { data: available } = await admin.rpc("slug_available", { p_slug: slug.data });
    if (available !== true) throw new ActionError("Bu manzil band yoki noto'g'ri — boshqa manzil tanlang");

    const { error: slugError } = await admin.from("organizations").update({ slug: slug.data }).eq("id", id.data);
    if (slugError) throw new ActionError("Manzilni saqlab bo'lmadi: " + slugError.message);

    // Login bilan kiradigan hamma a'zolarning ichki emaili yangi subdomenga o'tkaziladi.
    const { data: members } = await admin.from("org_members").select("user_id, login").eq("org_id", id.data);
    const failed: string[] = [];
    for (const m of (members ?? []) as { user_id: string; login: string | null }[]) {
      if (!m.login) continue;
      const { data: current } = await admin.auth.admin.getUserById(m.user_id);
      // Haqiqiy email bilan ochilgan eski hisoblarga tegilmaydi.
      if (!current.user?.email?.endsWith(`@${IDENTITY_DOMAIN}`)) continue;
      const { error } = await admin.auth.admin.updateUserById(m.user_id, {
        email: `${m.login}__${slug.data}@${IDENTITY_DOMAIN}`,
        email_confirm: true,
      });
      if (error) failed.push(m.login);
    }
    if (failed.length > 0) {
      throw new ActionError(`Manzil saqlandi, lekin bu loginlar ko'chmadi: ${failed.join(", ")}. Qayta urinib ko'ring.`);
    }

    revalidatePath("/admin", "layout");
    return { slug: slug.data };
  });
}
