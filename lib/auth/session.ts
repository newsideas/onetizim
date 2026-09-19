import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Segment } from "@/lib/segment";
import { isRole, permissionsFor, type Permission, type Role } from "@/lib/auth/permissions";
import { ActionError } from "@/lib/actions/result";
import { resolveHost } from "@/lib/tenant";
import { effectiveStatus, type OrgPlan } from "@/lib/platform";

export interface CurrentOrg {
  id: string;
  name: string;
  type: Segment;
  tin: string | null;
  region: string | null;
  district: string | null;
  address: string | null;
  director_last_name: string | null;
  director_first_name: string | null;
  phone: string | null;
  plan: string | null;
  trial_ends_at: string | null;
}

export interface Session {
  supabase: SupabaseClient;
  user: User;
  org: CurrentOrg;
  role: Role;
  permissions: Permission[];
  /** Xodim kartasi (teachers.id) — o'qituvchining guruhlarini topish uchun. */
  employeeId: string | null;
  displayName: string;
  /** Obuna (sinov) muddati tugagan yoki to'xtatilgan — maktab bloklanadi. */
  expired: boolean;
}

interface MemberRow {
  role: string;
  employee_id: string | null;
  full_name: string | null;
  org: CurrentOrg | null;
}

/** Ro'yxatdan o'tishda user_metadata'ga yozilgan ma'lumotlar. */
interface SignupMetadata {
  invite_token?: string;
  full_name?: string;
  org_name?: string;
  org_type?: Segment;
  org_slug?: string;
  tin?: string;
  region?: string;
  district?: string;
  address?: string;
  director_last_name?: string;
  director_first_name?: string;
  phone?: string;
}

const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"]);

/** slug berilsa faqat shu subdomen maktabidagi a'zolik olinadi. */
async function loadMember(supabase: SupabaseClient, userId: string, slug?: string) {
  let query = supabase
    .from("org_members")
    .select("role, employee_id, full_name, org:organizations!inner(*)")
    .eq("user_id", userId);
  if (slug) query = query.eq("org.slug", slug);
  const { data, error } = await query.limit(1).maybeSingle();

  if (error && MISSING_TABLE_CODES.has(error.code)) {
    // 0016 migratsiyasi hali qo'llanmagan baza: eski model — faqat egasi.
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();
    return org
      ? ({ role: "owner", employee_id: null, full_name: null, org } as MemberRow)
      : null;
  }
  if (error) throw new Error("A'zolikni o'qishda xatolik: " + error.message);

  return data as unknown as MemberRow | null;
}

/**
 * A'zolik yo'q bo'lsa: taklif orqali ro'yxatdan o'tgan xodimning taklifini
 * qabul qiladi yoki direktor ro'yxatdan o'tganda kiritgan muassasani
 * yaratadi. "Confirm email" yoqilgan bo'lsa signUp paytida sessiya yo'q,
 * shuning uchun bu birinchi kirishda bajariladi.
 */
async function ensureMembership(supabase: SupabaseClient, user: User, slug?: string) {
  const meta = (user.user_metadata ?? {}) as SignupMetadata;

  if (meta.invite_token) {
    await supabase.rpc("accept_invite", { p_token: meta.invite_token });
    return;
  }

  if (!meta.org_name) return;
  // Maktab faqat ro'yxatdan o'tishda tanlangan o'z subdomenida yaratiladi.
  if (slug && meta.org_slug !== slug) return;

  await supabase.from("organizations").upsert(
    {
      owner_id: user.id,
      name: meta.org_name,
      type: meta.org_type || "markaz",
      slug: meta.org_slug || null,
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
}

/** Joriy so'rov uchun bir marta hisoblanadi (layout va sahifa bo'lishadi). */
export const getSession = cache(async (): Promise<Session> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const host = resolveHost((await headers()).get("host"));
  const slug = host.kind === "tenant" ? host.slug : undefined;

  let member = await loadMember(supabase, user.id, slug);
  if (!member) {
    await ensureMembership(supabase, user, slug);
    member = await loadMember(supabase, user.id, slug);
  }
  if (!member?.org || !isRole(member.role)) redirect(slug ? "/no-access" : "/onboarding");

  const meta = (user.user_metadata ?? {}) as SignupMetadata;

  return {
    supabase,
    user,
    org: member.org,
    role: member.role,
    permissions: permissionsFor(member.role),
    employeeId: member.employee_id,
    displayName: member.full_name || meta.full_name || user.email || "Foydalanuvchi",
    expired:
      effectiveStatus({
        plan: (member.org.plan ?? "trial") as OrgPlan,
        trial_ends_at: member.org.trial_ends_at,
      }) === "expired",
  };
});

/** Sahifalar uchun: ruxsat bo'lmasa /403 sahifasiga yo'naltiradi. */
export async function requirePermission(permission: Permission): Promise<Session> {
  const session = await getSession();
  if (session.expired) redirect("/subscription-expired");
  if (!session.permissions.includes(permission)) redirect("/403");
  return session;
}

/** Server action'lar uchun: ruxsat bo'lmasa xatolik tashlaydi. */
export async function assertPermission(permission: Permission): Promise<Session> {
  const session = await getSession();
  if (session.expired) {
    throw new ActionError("Obuna muddati tugagan. Administrator bilan bog'laning.");
  }
  if (!session.permissions.includes(permission)) {
    throw new ActionError("Bu amal uchun ruxsatingiz yo'q");
  }
  return session;
}
