import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { OrganizationType } from "@/types/database";

/**
 * Kirgan foydalanuvchining tashkiloti bazada yo'q bo'lsa, ro'yxatdan
 * o'tishda saqlangan user_metadata (org_name, org_type) asosida yaratadi.
 *
 * Nega shu yerda, signUp vaqtida emas: Supabase loyihasida "Confirm email"
 * yoqilgan bo'lsa, signUp paytida hali sessiya (auth.uid()) mavjud bo'lmaydi
 * va RLS organizations'ga yozishga yo'l qo'ymaydi. Shuning uchun tashkilot
 * birinchi muvaffaqiyatli (tasdiqlangan) kirishda shu yordamchi orqali
 * yaratiladi.
 */
export async function ensureOrganization(supabase: SupabaseClient, user: User) {
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const orgName = (user.user_metadata?.org_name as string) || "Mening tashkilotim";
  const orgType = (user.user_metadata?.org_type as OrganizationType) || "togarak";

  const { data: created, error } = await supabase
    .from("organizations")
    .insert({ name: orgName, type: orgType, owner_id: user.id })
    .select("id")
    .single();

  if (error) throw error;
  return created;
}
