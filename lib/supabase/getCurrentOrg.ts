import type { SupabaseClient } from "@supabase/supabase-js";
import type { Segment } from "@/lib/segment";

export interface CurrentOrg {
  id: string;
  name: string;
  type: Segment;
}

/** Joriy (kirgan) foydalanuvchining tashkiloti — turi bilan birga. */
export async function getCurrentOrg(
  supabase: SupabaseClient,
): Promise<CurrentOrg> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Avtorizatsiyadan o'tilmagan");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, type")
    .eq("owner_id", user.id)
    .single();

  if (!org) throw new Error("Tashkilot topilmadi");
  return org as CurrentOrg;
}

/** Faqat id kerak bo'lganda (server action'larda). */
export async function getCurrentOrgId(supabase: SupabaseClient): Promise<string> {
  const org = await getCurrentOrg(supabase);
  return org.id;
}
