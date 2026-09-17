import { requirePermission } from "@/lib/auth/session";
import { getOrgMembers } from "@/lib/staff";
import { ListPageShell } from "@/components/ui/ListPage";
import { StaffTabs } from "@/components/staff/StaffTabs";
import { MembersTable } from "@/components/staff/MembersTable";
import { InviteStaffButton, type TeacherOption } from "@/components/staff/InviteStaffButton";
import { PendingInvitesList, type PendingInvite } from "@/components/staff/PendingInvitesList";

export default async function StaffAccessPage() {
  const { supabase, org, user } = await requirePermission("staff.manage");

  const [members, { data: employees }, { data: invitesData, error: invitesError }] = await Promise.all([
    getOrgMembers(supabase, org.id),
    supabase.from("teachers").select("id, full_name").eq("is_active", true).order("full_name"),
    supabase
      .from("org_invites")
      .select("id, token, role, full_name, expires_at")
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  return (
    <ListPageShell
      title="Kirish va rollar"
      subtitle="Kim tizimga kira oladi va nima qila oladi"
      actions={<InviteStaffButton employees={(employees ?? []) as TeacherOption[]} />}
      tabs={<StaffTabs current="access" />}
      notice={
        invitesError
          ? "Taklif jadvali bazada topilmadi — 0016_org_members.sql va 0021_staff_invites.sql migratsiyalarini Supabase SQL Editor'da ishga tushiring."
          : undefined
      }
    >
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ink-muted">A&apos;zolar</h2>
        <MembersTable members={members} currentUserId={user.id} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ink-muted">Kutilayotgan takliflar</h2>
        <PendingInvitesList invites={(invitesData ?? []) as PendingInvite[]} />
      </div>
    </ListPageShell>
  );
}
