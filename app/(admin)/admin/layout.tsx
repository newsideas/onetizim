import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { AdminHeader } from "@/components/platform/AdminHeader";
import { ForceLightTheme } from "@/components/platform/ForceLightTheme";
import { loginFromEmail } from "@/lib/auth/identity";

export const metadata: Metadata = {
  title: "Super Admin · EduGram",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <ForceLightTheme />
      <AdminHeader login={loginFromEmail(user.email)} />
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </div>
  );
}
