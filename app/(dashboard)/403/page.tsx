import Link from "next/link";
import { Lock } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/permissions";

export default async function ForbiddenPage() {
  const { role } = await getSession();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <Lock size={26} aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-ink">Bu bo&apos;limga kirish huquqingiz yo&apos;q</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Sizning rolingiz: <span className="font-medium text-ink">{ROLE_LABELS[role]}</span>. Agar
        bu bo&apos;lim kerak bo&apos;lsa, direktorga murojaat qiling.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
