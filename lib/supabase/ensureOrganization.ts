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
 *
 * Race-safe: bir nechta so'rov (masalan, Next.js'ning parallel prefetch'i)
 * bir vaqtda kelishi mumkin. "avval tekshir, keyin yarat" usuli poyga
 * holatiga olib kelardi (0003_org_owner_unique.sql migratsiyasidan oldin
 * shu sabab dublikatlar paydo bo'lgan edi). Shu sabab upsert +
 * organizations.owner_id'dagi UNIQUE cheklovga tayaniladi.
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

  // Ikkita parallel so'rov bir vaqtda shu yerga yetib kelsa, UNIQUE
  // cheklov tufayli faqat bittasi haqiqiy yozuv yaratadi — boshqasi
  // jim o'tkazib yuboriladi (ignoreDuplicates), keyin ikkalasi ham
  // pastdagi select orqali bir xil, mavjud qatorni topib oladi.
  await supabase
    .from("organizations")
    .upsert(
      { name: orgName, type: orgType, owner_id: user.id },
      { onConflict: "owner_id", ignoreDuplicates: true },
    );

  const { data: org, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (error) throw error;
  return org;
}
