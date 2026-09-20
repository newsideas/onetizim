import { requirePermission } from "@/lib/auth/session";
import { getOrgMembers } from "@/lib/staff";
import { ListPageShell } from "@/components/ui/ListPage";
import { StaffTabs } from "@/components/staff/StaffTabs";
import { RolesManager, type BuiltInRoleRow, type CustomRole } from "@/components/staff/RolesManager";
import { isRole, type Role } from "@/lib/auth/permissions";

interface RoleRow {
  id: string;
  name: string;
  comment: string | null;
  base_role: string;
  permissions: string[] | null;
}

const BUILT_IN_COMMENTS: Record<Role, string> = {
  owner: "Barcha bo'limlar",
  manager: "O'quvchi qabul qiladi",
  teacher: "Ustoz",
  accountant: "To'lovlarni qabul qiladi",
};

/** Rollar (Edu tizimdagi "Rollar"): tayyor rollar va markaz o'zi yaratgan rollar. */
export default async function StaffRolesPage() {
  const { supabase, org } = await requirePermission("staff.manage");

  const [members, rolesRes] = await Promise.all([
    getOrgMembers(supabase, org.id),
    supabase.from("org_roles").select("id, name, comment, base_role, permissions").order("created_at"),
  ]);

  // Maxsus rollarga biriktirilmagan xodimlar tayyor rol bo'yicha sanaladi.
  const builtIn: BuiltInRoleRow[] = (["owner", "manager", "teacher", "accountant"] as Role[]).map((role) => ({
    role,
    comment: BUILT_IN_COMMENTS[role],
    memberCount: members.filter((m) => m.role === role && !m.customRoleId).length,
  }));

  const custom: CustomRole[] = ((rolesRes.data ?? []) as RoleRow[]).flatMap((r) =>
    isRole(r.base_role)
      ? [
          {
            id: r.id,
            name: r.name,
            comment: r.comment,
            baseRole: r.base_role,
            permissions: r.permissions ?? [],
            memberCount: members.filter((m) => m.customRoleId === r.id).length,
          },
        ]
      : [],
  );

  return (
    <ListPageShell
      title="Rollar"
      subtitle="Xodimlar rollari va ruxsatlari"
      tabs={<StaffTabs current="roles" />}
      notice={
        rolesRes.error
          ? "Rollar jadvali bazada topilmadi — yangi migratsiyalarni (yangi-migratsiyalar.sql, 0063) Supabase SQL Editor'da ishga tushiring."
          : undefined
      }
    >
      <RolesManager builtIn={builtIn} custom={custom} tableReady={!rolesRes.error} />
    </ListPageShell>
  );
}
