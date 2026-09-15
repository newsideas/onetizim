import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Segment } from "@/lib/segment";

/** Ro'yxatdan o'tishda user_metadata'ga yozilgan muassasa ma'lumotlari. */
interface OrgMetadata {
  org_name?: string;
  org_type?: Segment;
  tin?: string;
  region?: string;
  district?: string;
  address?: string;
  director_last_name?: string;
  director_first_name?: string;
  phone?: string;
}

/**
 * Kirgan foydalanuvchining muassasasi bazada yo'q bo'lsa, ro'yxatdan
 * o'tishda saqlangan user_metadata asosida yaratadi.
 *
 * Nega shu yerda, signUp vaqtida emas: "Confirm email" yoqilgan bo'lsa,
 * signUp paytida hali sessiya (auth.uid()) bo'lmaydi va RLS yozishga yo'l
 * qo'ymaydi. Shuning uchun muassasa birinchi muvaffaqiyatli kirishda
 * yaratiladi.
 *
 * Race-safe: bir nechta parallel so'rov kelishi mumkin (Next.js prefetch),
 * shuning uchun upsert + organizations.owner_id'dagi UNIQUE cheklov.
 */
export async function ensureOrganization(supabase: SupabaseClient, user: User) {
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) return existing;

  const meta = (user.user_metadata ?? {}) as OrgMetadata;

  await supabase.from("organizations").upsert(
    {
      owner_id: user.id,
      name: meta.org_name || "Mening muassasam",
      type: meta.org_type || "markaz",
      tin: meta.tin || null,
      region: meta.region || null,
      district: meta.district || null,
      address: meta.address || null,
      director_last_name: meta.director_last_name || null,
      director_first_name: meta.director_first_name || null,
      phone: meta.phone || null,
    },
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
