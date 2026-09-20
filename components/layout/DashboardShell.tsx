"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const COLLAPSE_KEY = "edugram-sidebar-collapsed";

export function DashboardShell({
  children,
  orgName,
  userEmail,
  trialDaysLeft,
  debtorCount,
}: {
  children: React.ReactNode;
  orgName?: string;
  userEmail?: string;
  trialDaysLeft: number | null;
  debtorCount: number;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Tanlov brauzerda saqlanadi; server'da o'qib bo'lmagani uchun mount'dan keyin tiklanadi.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
    } catch {
      // Maxfiy rejim yoki bloklangan saqlash — menyu ochiq holda qoladi.
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // Saqlab bo'lmasa ham menyu joriy sessiyada ishlaydi.
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Desktop: doim ko'rinadigan sidebar (yig'ilsa faqat ikonkalar) */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden bg-surface transition-[width] duration-300 ease-(--ease-edu) md:block ${
          collapsed ? "w-[72px]" : "w-48"
        }`}
      >
        <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </aside>

      {/* Mobil: ustidan chiqadigan sidebar (drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-56 bg-surface">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div
        className={`transition-[padding] duration-300 ease-(--ease-edu) ${
          collapsed ? "md:pl-[72px]" : "md:pl-48"
        }`}
      >
        <Header
          orgName={orgName}
          userEmail={userEmail}
          trialDaysLeft={trialDaysLeft}
          debtorCount={debtorCount}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
