import type { SupabaseClient } from "@supabase/supabase-js";

export type OrgPlan = "trial" | "active" | "expired";

export interface PlatformOrg {
  id: string;
  name: string;
  type: string;
  plan: OrgPlan;
  trial_ends_at: string | null;
  created_at: string;
  /** Direktor telefoni (kirish logini). */
  phone: string | null;
  slug: string | null;
  students: number;
  members: number;
  /** To'langan obuna tugaydigan sana (0064); yo'q bo'lsa faol obuna muddatsiz. */
  paid_until: string | null;
}

export interface PlatformPayment {
  id: string;
  org_id: string;
  amount: number;
  months: number;
  method: string;
  note: string | null;
  paid_at: string;
}

/** Sinov muddati o'tgan bo'lsa reja "trial" bo'lsa ham amalda "expired". */
export type EffectiveStatus = "active" | "trial" | "expired";

export function effectiveStatus(
  org: Pick<PlatformOrg, "plan" | "trial_ends_at"> & { paid_until?: string | null },
  now = Date.now(),
): EffectiveStatus {
  if (org.plan === "active") {
    // To'langan davr tugagan bo'lsa (kun oxirigacha amal qiladi) obuna to'xtaydi.
    return org.paid_until && new Date(`${org.paid_until}T23:59:59`).getTime() < now ? "expired" : "active";
  }
  if (org.plan === "expired") return "expired";
  return org.trial_ends_at && new Date(org.trial_ends_at).getTime() < now ? "expired" : "trial";
}

export const STATUS_LABELS: Record<EffectiveStatus, string> = {
  active: "Faol obuna",
  trial: "Sinov muddati",
  expired: "Muddati o'tgan",
};

/** Markazlarning platformaga to'lovlari (0064). Jadval bo'lmasa bo'sh ro'yxat. */
export async function fetchPlatformPayments(supabase: SupabaseClient): Promise<PlatformPayment[]> {
  const { data, error } = await supabase
    .from("platform_payments")
    .select("id, org_id, amount, months, method, note, paid_at")
    .order("paid_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return [];
  return ((data ?? []) as PlatformPayment[]).map((p) => ({ ...p, amount: Number(p.amount) }));
}

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
