import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { AdminHeader } from "@/components/platform/AdminHeader";

export const metadata: Metadata = {
  title: "Super Admin · EduGram",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <AdminHeader email={user.email} />
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </div>
  );
}
