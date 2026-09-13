import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureOrganization } from "@/lib/supabase/ensureOrganization";
import { SignOutButton } from "@/components/auth/SignOutButton";

// TODO: 4-bosqich — sidebar (Guruhlar, O'quvchilar, Davomat, To'lovlar,
// Jadval, Sozlamalar) + header shu yerga qo'shiladi.
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

  return (
    <div className="min-h-screen bg-[#0f1420] text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="font-semibold">To&apos;garak CRM</span>
        <SignOutButton />
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
