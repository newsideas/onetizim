"use client";

import { Menu } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useSegment } from "@/components/layout/SegmentProvider";

export function Header({
  onMenuClick,
  orgName,
  userEmail,
}: {
  onMenuClick: () => void;
  orgName?: string;
  userEmail?: string;
}) {
  const { terms } = useSegment();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface px-4 py-3 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-ink-muted hover:bg-canvas hover:text-ink md:hidden"
        aria-label="Menyu"
      >
        <Menu size={22} />
      </button>

      {/* Mobilda muassasa nomi, desktopda foydalanuvchi ma'lumoti */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink md:hidden">
          {orgName || "EduGram"}
        </div>
        <div className="hidden md:block">
          <div className="truncate text-sm font-medium text-ink">
            {userEmail || "Foydalanuvchi"}
          </div>
          <div className="text-xs text-ink-faint">Direktor · {terms.label}</div>
        </div>
      </div>

      <SignOutButton />
    </header>
  );
}
