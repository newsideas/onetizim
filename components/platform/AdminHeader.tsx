"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { useSignOut } from "@/components/auth/useSignOut";

const LINKS = [
  { href: "/admin", label: "Umumiy ko'rsatkichlar" },
  { href: "/admin/requests", label: "Arizalar" },
  { href: "/admin/organizations", label: "Markazlar" },
  { href: "/admin/news", label: "Yangiliklar" },
  { href: "/admin/payments", label: "To'lovlar" },
  { href: "/admin/profile", label: "Profil" },
];

/** Super Admin panelining yagona sarlavhasi — maktab menyusidan butunlay alohida. */
export function AdminHeader({ login }: { login?: string | null }) {
  const pathname = usePathname();
  const signOut = useSignOut();

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 md:px-6">
        <div className="flex items-center gap-2 text-ink">
          <ShieldCheck size={20} className="text-brand-600" aria-hidden="true" />
          <span className="text-sm font-semibold">EduGram · Super Admin</span>
        </div>

        <nav aria-label="Super Admin menyusi" className="flex gap-1">
          {LINKS.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-brand-600 text-white" : "text-ink-muted hover:bg-canvas hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm">
          {login && <span className="hidden text-ink-faint sm:inline">{login}</span>}
          <Link href="/" className="text-ink-muted hover:text-ink">
            Markaz paneli
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <LogOut size={15} aria-hidden="true" />
            Chiqish
          </button>
        </div>
      </div>
    </header>
  );
}
