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
  /** Maktab (markaz) subdomeni — login uchun ichki email shunga bog'lanadi. */
  slug: string | null;
  tin: string | null;
  region: string | null;
  district: string | null;
  address: string | null;
  director_last_name: string | null;
  director_first_name: string | null;
  phone: string | null;
  plan: string | null;
  trial_ends_at: string | null;
  /** To'langan obuna tugaydigan sana (0064); migratsiya qo'llanmaguncha undefined. */
  paid_until?: string | null;
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

/** Hisob yaratilganda user_metadata'ga yozilgan ma'lumotlar. */
interface SignupMetadata {
  invite_token?: string;
  full_name?: string;
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
 * qabul qiladi. Markazni faqat super admin ochadi: foydalanuvchi
 * metadata'si orqali muassasa yaratish yo'li yopilgan (aks holda ochiq
 * signUp bilan har kim markaz ochib olishi mumkin edi).
 */
async function ensureMembership(supabase: SupabaseClient, user: User) {
  const meta = (user.user_metadata ?? {}) as SignupMetadata;
  if (meta.invite_token) {
    await supabase.rpc("accept_invite", { p_token: meta.invite_token });
  }
}

/**
 * Xodimga maxsus rol (0063) biriktirilgan bo'lsa, ruxsatlar asosiy rol ruxsatlarining shu rolda
 * belgilangan qismiga qisqaradi. Migratsiya qo'llanmagan bo'lsa yoki so'rov xato bersa — asosiy rol
 * ruxsatlari qoladi (login hech qachon buzilmaydi).
 */
async function loadPermissions(supabase: SupabaseClient, userId: string, role: Role): Promise<Permission[]> {
  const base = permissionsFor(role);
  if (role === "owner") return base;

  const { data: link, error: linkError } = await supabase
    .from("org_members")
    .select("custom_role_id")
    .eq("user_id", userId)
    .maybeSingle();
  const roleId = linkError ? null : (link?.custom_role_id as string | null | undefined);
  if (!roleId) return base;

  const { data: custom, error } = await supabase.from("org_roles").select("permissions").eq("id", roleId).maybeSingle();
  if (error || !custom) return base;

  const granted = new Set<string>((custom.permissions as string[] | null) ?? []);
  return base.filter((p) => granted.has(p));
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
    await ensureMembership(supabase, user);
    member = await loadMember(supabase, user.id, slug);
  }
  if (!member?.org || !isRole(member.role)) redirect("/no-access");

  const meta = (user.user_metadata ?? {}) as SignupMetadata;

  return {
    supabase,
    user,
    // Tizim faqat o'quv markazlarga xizmat qiladi: bazada eski tur ("maktab"/"bogcha")
    // qolgan bo'lsa ham (0043 qo'llanmaguncha) interfeys markaz sifatida ishlaydi.
    org: { ...member.org, type: "markaz" },
    role: member.role,
    permissions: await loadPermissions(supabase, user.id, member.role),
    employeeId: member.employee_id,
    displayName: member.full_name || meta.full_name || user.email || "Foydalanuvchi",
    expired:
      effectiveStatus({
        plan: (member.org.plan ?? "trial") as OrgPlan,
        trial_ends_at: member.org.trial_ends_at,
        paid_until: member.org.paid_until,
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
