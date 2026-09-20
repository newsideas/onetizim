"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertPlatformAdmin } from "@/lib/auth/platform-admin";
import { ActionError, runAction } from "@/lib/actions/result";
import { fetchPlatformOrgs } from "@/lib/platform";
import { createAdminClient } from "@/lib/supabase/admin";
import { identityToEmail, normalizePhone, PLATFORM_SLUG } from "@/lib/auth/identity";

const planChangeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("activate") }),
  z.object({ kind: z.literal("expire") }),
]);

export type PlanChange = z.input<typeof planChangeSchema>;

/**
 * Maktab obunasini o'zgartiradi: sinovni uzaytirish, faollashtirish yoki
 * to'xtatish. Ruxsat bazadagi admin_set_plan ichida ham tekshiriladi.
 */
export async function setOrgPlan(orgId: string, change: PlanChange) {
  return runAction(async () => {
    const id = z.string().uuid().safeParse(orgId);
    const parsed = planChangeSchema.safeParse(change);
    if (!id.success || !parsed.success) throw new ActionError("Ma'lumotlar noto'g'ri");

    const { supabase } = await assertPlatformAdmin();
    const orgs = await fetchPlatformOrgs(supabase);
    const org = orgs.find((o) => o.id === id.data);
    if (!org) throw new ActionError("Maktab topilmadi");

    const plan = parsed.data.kind === "activate" ? "active" : "expired";

    const { error } = await supabase.rpc("admin_set_plan", {
      p_org: id.data,
      p_plan: plan,
      p_trial_ends: null,
    });
    if (error) throw new ActionError("Obunani o'zgartirib bo'lmadi: " + error.message);

    revalidatePath("/admin");
    revalidatePath("/admin/organizations");
  });
}

const paymentSchema = z.object({
  amount: z.number({ message: "Summani kiriting" }).positive("Summa musbat bo'lishi kerak").max(1_000_000_000_000),
  months: z.number({ message: "Oylar sonini kiriting" }).int("Oylar soni butun son bo'lishi kerak").min(1, "Kamida 1 oy").max(36),
  method: z.enum(["Naqd", "Karta", "Bank o'tkazmasi"], { message: "To'lov turini tanlang" }),
  note: z.string().trim().max(300, "Izoh juda uzun").optional(),
  paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sanani tanlang"),
});

export type PaymentInput = z.input<typeof paymentSchema>;

/**
 * Markazning platformaga to'lovini yozadi va obunani shu davrga uzaytiradi.
 * Bazadagi admin_record_payment (0064) ruxsatni ham, hisob-kitobni ham o'zi bajaradi.
 */
export async function recordPlatformPayment(orgId: string, input: PaymentInput) {
  return runAction(async () => {
    const id = z.string().uuid().safeParse(orgId);
    const parsed = paymentSchema.safeParse(input);
    if (!id.success) throw new ActionError("Markaz topilmadi");
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Ma'lumotlar noto'g'ri");

    const { supabase } = await assertPlatformAdmin();
    const v = parsed.data;
    const { error } = await supabase.rpc("admin_record_payment", {
      p_org: id.data,
      p_amount: v.amount,
      p_months: v.months,
      p_method: v.method,
      p_note: v.note ?? "",
      p_paid_at: v.paidAt,
    });
    if (error) {
      throw new ActionError(
        error.message.includes("admin_record_payment")
          ? "To'lovlar hali sozlanmagan — 0064 migratsiyasini Supabase SQL Editor'da ishga tushiring"
          : "To'lovni yozib bo'lmadi: " + error.message,
      );
    }

    revalidatePath("/admin", "layout");
  });
}

const passwordSchema = z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak").max(72, "Parol juda uzun");

/** Markaz direktorining parolini yangilaydi (direktor unutganda). */
export async function resetDirectorPassword(orgId: string, password: string) {
  return runAction(async () => {
    const id = z.string().uuid().safeParse(orgId);
    const pw = passwordSchema.safeParse(password);
    if (!id.success) throw new ActionError("Markaz topilmadi");
    if (!pw.success) throw new ActionError(pw.error.issues[0]?.message ?? "Parol noto'g'ri");

    await assertPlatformAdmin();
    const admin = createAdminClient();
    const { data: org } = await admin.from("organizations").select("owner_id").eq("id", id.data).maybeSingle();
    if (!org?.owner_id) throw new ActionError("Direktor hisobi topilmadi");

    const { error } = await admin.auth.admin.updateUserById(org.owner_id as string, { password: pw.data });
    if (error) throw new ActionError("Parolni yangilab bo'lmadi: " + error.message);
  });
}

/**
 * Super adminning o'z kirish ma'lumotlarini telefon + parol qiladi (email o'rniga).
 * Hisob ichki manzilga ko'chadi; shundan keyin admin.<domen> ga telefon va parol bilan kiriladi.
 */
export async function setAdminCredentials(phoneInput: string, password: string) {
  return runAction(async () => {
    const { user } = await assertPlatformAdmin();
    const phone = normalizePhone(phoneInput);
    const email = phone ? identityToEmail(phone, PLATFORM_SLUG) : null;
    if (!phone || !email) throw new ActionError("Telefon raqamni to'g'ri kiriting");
    const pw = passwordSchema.safeParse(password);
    if (!pw.success) throw new ActionError(pw.error.issues[0]?.message ?? "Parol noto'g'ri");

    const { error } = await createAdminClient().auth.admin.updateUserById(user.id, {
      email,
      password: pw.data,
      email_confirm: true,
      user_metadata: { phone },
    });
    if (error) {
      throw new ActionError(
        error.message.toLowerCase().includes("already")
          ? "Bu telefon raqam band"
          : "Ma'lumotlarni yangilab bo'lmadi: " + error.message,
      );
    }
    return { phone };
  });
}
