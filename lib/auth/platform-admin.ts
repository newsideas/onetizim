import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActionError } from "@/lib/actions/result";
import { isAdminPanelEnabled } from "@/lib/tenant";

/**
 * Super Admin paneli maktab (org) sessiyasiga bog'liq emas: faqat foydalanuvchi
 * kirgan va bazadagi is_platform_admin() true qaytarishi kerak. Maktab
 * kodi (getSession, ruxsatlar, menyu) bu haqda hech narsa bilmaydi.
 */
const getAdminContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.rpc("is_platform_admin");
  return { supabase, user, isAdmin: data === true };
});

/** Sahifalar uchun: admin bo'lmasa 404 — panel mavjudligi ham sezilmaydi. */
export async function requirePlatformAdmin() {
  if (!isAdminPanelEnabled()) notFound();
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) notFound();
  return ctx;
}

/** Server action'lar uchun. Ruxsat bazadagi funksiyalarda ham qayta tekshiriladi. */
export async function assertPlatformAdmin() {
  // Server amallari boshqa manzildan chaqirilsa ham internetdagi versiyada ishlamaydi.
  if (!isAdminPanelEnabled()) throw new ActionError("Ruxsat yo'q");
  const ctx = await getAdminContext();
  if (!ctx.isAdmin) throw new ActionError("Ruxsat yo'q");
  return ctx;
}
