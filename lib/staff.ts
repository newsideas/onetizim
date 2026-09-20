import type { SupabaseClient } from "@supabase/supabase-js";
import { isRole, type Role } from "@/lib/auth/permissions";

export interface OrgMember {
  userId: string;
  name: string;
  email: string | null;
  /** Telefon yoki login (login/parol bilan kiradiganlar uchun). */
  login: string | null;
  role: Role;
  employeeId: string | null;
  createdAt: string;
  /** Biriktirilgan maxsus rol (0063); yo'q bo'lsa `role` bo'yicha ishlaydi. */
  customRoleId: string | null;
}

/** Tashkilot a'zolari (tizimga kira oladigan xodimlar). */
export async function getOrgMembers(supabase: SupabaseClient, orgId: string): Promise<OrgMember[]> {
  const { data } = await supabase
    .from("org_members")
    .select("user_id, role, full_name, email, login, employee_id, created_at")
    .eq("org_id", orgId)
    .order("created_at");

  // Maxsus rol ustuni (0063) alohida so'raladi: migratsiya qo'llanmagan bo'lsa ro'yxat baribir chiqadi.
  const { data: links, error: linksError } = await supabase
    .from("org_members")
    .select("user_id, custom_role_id")
    .eq("org_id", orgId);
  const customByUser = new Map<string, string | null>(
    linksError ? [] : (links ?? []).map((l) => [l.user_id as string, l.custom_role_id as string | null]),
  );

  return (data ?? []).flatMap((m) =>
    isRole(m.role)
      ? [
          {
            userId: m.user_id as string,
            name: (m.full_name as string | null) || (m.email as string | null) || "Nomsiz",
            email: m.email as string | null,
            login: (m.login as string | null) ?? null,
            role: m.role,
            employeeId: m.employee_id as string | null,
            createdAt: m.created_at as string,
            customRoleId: customByUser.get(m.user_id as string) ?? null,
          },
        ]
      : [],
  );
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}
