"use client";

import { Menu } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-[#0f1420] px-4 py-3 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-white/70 hover:bg-white/5 hover:text-white md:hidden"
        aria-label="Menyu"
      >
        <Menu size={22} />
      </button>

      <span className="font-semibold text-white md:hidden">To&apos;garak CRM</span>

      <div className="ml-auto">
        <SignOutButton />
      </div>
    </header>
  );
}
