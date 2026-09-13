import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureOrganization } from "@/lib/supabase/ensureOrganization";
import { DashboardShell } from "@/components/layout/DashboardShell";

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

  return <DashboardShell>{children}</DashboardShell>;
}
