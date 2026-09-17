import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SegmentProvider } from "@/components/layout/SegmentProvider";
import { PermissionsProvider } from "@/components/auth/PermissionsProvider";
import { daysUntil } from "@/lib/utils/date";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, org, role, permissions, displayName } = await getSession();

  // Qarzdorlar soni faqat to'lovlarni ko'ra oladiganlar uchun.
  let debtorCount = 0;
  if (permissions.includes("payments.manage")) {
    const { count } = await supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .lt("balance", 0)
      .neq("status", "archived");
    debtorCount = count ?? 0;
  }

  return (
    <SegmentProvider segment={org.type}>
      <PermissionsProvider role={role} displayName={displayName} permissions={permissions}>
        <DashboardShell
          orgName={org.name}
          userEmail={user.email}
          trialDaysLeft={daysUntil(org.trial_ends_at)}
          debtorCount={debtorCount}
        >
          {children}
        </DashboardShell>
      </PermissionsProvider>
    </SegmentProvider>
  );
}
