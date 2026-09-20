import { requirePermission } from "@/lib/auth/session";
import { getOrgMembers } from "@/lib/staff";
import { ListPageShell } from "@/components/ui/ListPage";
import { StaffTabs } from "@/components/staff/StaffTabs";
import { MembersTable } from "@/components/staff/MembersTable";
import { isBuiltinOverride } from "@/lib/permission-catalog";

/** Tizimga kira oladigan xodimlar: rollarni biriktirish va kirish huquqini bekor qilish. */
export default async function StaffAccessPage() {
  const { supabase, org, user } = await requirePermission("staff.manage");

  const [members, { data: rolesData }] = await Promise.all([
    getOrgMembers(supabase, org.id),
    // Maxsus rollar (0063); jadval bo'lmasa bo'sh ro'yxat qaytadi.
    supabase.from("org_roles").select("id, name, permissions").order("created_at"),
  ]);

  return (
    <ListPageShell
      title="A'zolar"
      subtitle="Kim tizimga kira oladi va qaysi rolda. Yangi xodimga login va parol «Login va parollar» bo'limida beriladi"
      tabs={<StaffTabs current="access" />}
    >
      <MembersTable
        members={members}
        currentUserId={user.id}
        customRoles={((rolesData ?? []) as { id: string; name: string; permissions: string[] | null }[])
          .filter((r) => !isBuiltinOverride(r.permissions))
          .map(({ id, name }) => ({ id, name }))}
      />
    </ListPageShell>
  );
}
