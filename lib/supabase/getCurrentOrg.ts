import type { SupabaseClient } from "@supabase/supabase-js";

/** Joriy (kirgan) foydalanuvchining tashkilot id'sini qaytaradi. */
export async function getCurrentOrgId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Avtorizatsiyadan o'tilmagan");

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!org) throw new Error("Tashkilot topilmadi");
  return org.id;
}
