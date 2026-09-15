import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureOrganization } from "@/lib/supabase/ensureOrganization";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { SegmentProvider } from "@/components/layout/SegmentProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts allaqachon /login'ga yo'naltiradi, bu shunchaki qo'shimcha himoya.
  if (!user) {
    redirect("/login");
  }

  await ensureOrganization(supabase, user);

  // Muassasa turi butun interfeysni belgilaydi (atamalar, bo'limlar).
  const org = await getCurrentOrg(supabase);

  return (
    <SegmentProvider segment={org.type}>
      <DashboardShell orgName={org.name}>{children}</DashboardShell>
    </SegmentProvider>
  );
}
