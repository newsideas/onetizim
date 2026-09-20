import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { AdminCredentialsForm } from "@/components/platform/AdminCredentialsForm";
import { loginFromEmail } from "@/lib/auth/identity";

/** Super adminning kirish ma'lumotlari: telefon raqam va parol. */
export default async function PlatformProfilePage() {
  const { user } = await requirePlatformAdmin();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Profil</h1>
        <p className="text-sm text-ink-muted">Kirish telefon raqam va parol bilan bo&apos;ladi</p>
      </div>
      <AdminCredentialsForm currentLogin={loginFromEmail(user.email)} />
    </div>
  );
}
