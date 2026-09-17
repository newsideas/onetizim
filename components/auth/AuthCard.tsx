import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

/** Kirish sahifalari uslubidagi markazlashgan karta (taklif, onboarding). */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-canvas to-brand-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <Logo className="mb-6 h-12" />
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <div className="mt-1 mb-6 text-sm text-ink-muted">{subtitle}</div>}
        {children}
      </div>
    </main>
  );
}
