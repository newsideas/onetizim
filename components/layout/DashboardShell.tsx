"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function DashboardShell({
  children,
  orgName,
  userEmail,
}: {
  children: React.ReactNode;
  orgName?: string;
  userEmail?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Desktop: doim ko'rinadigan sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line md:block">
        <Sidebar orgName={orgName} />
      </aside>

      {/* Mobil: ustidan chiqadigan sidebar (drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-line">
            <Sidebar orgName={orgName} onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        <Header
          orgName={orgName}
          userEmail={userEmail}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
