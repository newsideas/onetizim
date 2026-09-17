"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, CalendarDays, Menu, Undo2 } from "lucide-react";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  ICON_BUTTON,
  LanguageMenu,
  NotificationsMenu,
  OrgSwitcher,
  QuickAddMenu,
  TrialBadge,
  UserMenu,
} from "@/components/layout/HeaderControls";

export function Header({
  onMenuClick,
  orgName,
  userEmail,
  trialDaysLeft,
  debtorCount,
}: {
  onMenuClick: () => void;
  orgName?: string;
  userEmail?: string;
  /** `organizations.trial_ends_at` asosida hisoblangan kunlar. */
  trialDaysLeft: number | null;
  /** Balansi manfiy bo'lgan o'quvchilar soni — bildirishnoma uchun. */
  debtorCount: number;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-surface px-3 py-2.5 md:gap-3 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className={`${ICON_BUTTON} md:hidden`}
        aria-label="Menyu"
      >
        <Menu size={22} />
      </button>

      <button
        type="button"
        onClick={() => router.back()}
        className={`${ICON_BUTTON} hidden sm:block`}
        aria-label="Orqaga"
        title="Orqaga"
      >
        <Undo2 size={18} />
      </button>

      <div className="hidden md:block">
        <OrgSwitcher orgName={orgName} />
      </div>

      <div className="min-w-0 flex-1">
        <GlobalSearch />
      </div>

      <TrialBadge daysLeft={trialDaysLeft} />

      <div className="flex items-center gap-0.5 md:gap-1">
        <div className="hidden sm:block">
          <LanguageMenu />
        </div>

        <ThemeToggle />

        <Link
          href="/education/schedule"
          className={`${ICON_BUTTON} hidden lg:block`}
          aria-label="Dars jadvali"
          title="Dars jadvali"
        >
          <CalendarDays size={18} />
        </Link>

        <Link
          href="/education/attendance"
          className={`${ICON_BUTTON} hidden lg:block`}
          aria-label="Davomat"
          title="Davomat"
        >
          <CalendarCheck size={18} />
        </Link>

        <QuickAddMenu />

        <NotificationsMenu debtorCount={debtorCount} trialDaysLeft={trialDaysLeft} />

        <UserMenu userEmail={userEmail} orgName={orgName} />
      </div>
    </header>
  );
}
