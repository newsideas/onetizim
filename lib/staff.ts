import type { SupabaseClient } from "@supabase/supabase-js";
import { isRole, type Role } from "@/lib/auth/permissions";

export interface OrgMember {
  userId: string;
  name: string;
  email: string | null;
  role: Role;
  employeeId: string | null;
  createdAt: string;
}

/** Tashkilot a'zolari (tizimga kira oladigan xodimlar). */
export async function getOrgMembers(supabase: SupabaseClient, orgId: string): Promise<OrgMember[]> {
  const { data } = await supabase
    .from("org_members")
    .select("user_id, role, full_name, email, employee_id, created_at")
    .eq("org_id", orgId)
    .order("created_at");

  return (data ?? []).flatMap((m) =>
    isRole(m.role)
      ? [
          {
            userId: m.user_id as string,
            name: (m.full_name as string | null) || (m.email as string | null) || "Nomsiz",
            email: m.email as string | null,
            role: m.role,
            employeeId: m.employee_id as string | null,
            createdAt: m.created_at as string,
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
