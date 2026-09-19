import type { SupabaseClient } from "@supabase/supabase-js";

export type OrgPlan = "trial" | "active" | "expired";

export interface PlatformOrg {
  id: string;
  name: string;
  type: string;
  plan: OrgPlan;
  trial_ends_at: string | null;
  created_at: string;
  owner_email: string | null;
  students: number;
  members: number;
}

/** Sinov muddati o'tgan bo'lsa reja "trial" bo'lsa ham amalda "expired". */
export type EffectiveStatus = "active" | "trial" | "expired";

export function effectiveStatus(org: Pick<PlatformOrg, "plan" | "trial_ends_at">, now = Date.now()): EffectiveStatus {
  if (org.plan === "active") return "active";
  if (org.plan === "expired") return "expired";
  return org.trial_ends_at && new Date(org.trial_ends_at).getTime() < now ? "expired" : "trial";
}

export const STATUS_LABELS: Record<EffectiveStatus, string> = {
  active: "Faol obuna",
  trial: "Sinov muddati",
  expired: "Muddati o'tgan",
};

/** Barcha maktablar. Faqat platforma administratoriga ishlaydi (DB tekshiradi). */
export async function fetchPlatformOrgs(supabase: SupabaseClient): Promise<PlatformOrg[]> {
  const { data, error } = await supabase.rpc("admin_organizations");
  if (error) throw new Error("Maktablar ro'yxatini o'qib bo'lmadi: " + error.message);
  return ((data ?? []) as PlatformOrg[]).map((o) => ({
    ...o,
    students: Number(o.students),
    members: Number(o.members),
  }));
}
