"use client";

import Link from "next/link";
import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  LogOut,
  Plus,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { Popover, PopoverItem } from "@/components/ui/Popover";
import { useSegment } from "@/components/layout/SegmentProvider";
import { usePermissions } from "@/components/auth/PermissionsProvider";
import type { Permission } from "@/lib/auth/permissions";
import { useSignOut } from "@/components/auth/useSignOut";

export const ICON_BUTTON =
  "rounded-lg p-2 text-ink-muted transition-colors hover:bg-canvas hover:text-ink";

/* ------------------------------------------------------------------ */
/* Muassasa tanlagich                                                  */
/* ------------------------------------------------------------------ */

/**
 * Hozircha bitta muassasa ko'rsatiladi. Filiallar qo'shilganda shu
 * menyu ro'yxatga aylanadi — tuzilma shunga tayyor.
 */
export function OrgSwitcher({ orgName }: { orgName?: string }) {
  const { terms } = useSegment();
  const { can } = usePermissions();

  return (
    <Popover
      align="left"
      panelClassName="w-64"
      triggerClassName="flex h-9 max-w-[220px] items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-canvas"
      label={
        <>
          <Building2 size={16} className="shrink-0 text-ink-muted" />
          <span className="truncate">{orgName || "Muassasa"}</span>
          <ChevronDown size={14} className="ml-auto shrink-0 text-ink-faint" />
        </>
      }
    >
      {(close) => (
        <>
          <div className="px-3 py-2">
            <div className="truncate text-sm font-medium text-ink">
              {orgName || "Muassasa"}
            </div>
            <div className="text-xs text-ink-faint">{terms.label}</div>
          </div>
          {can("settings.manage") && (
            <>
              <div className="my-1 border-t border-line" />
              <Link href="/settings" onClick={close}>
                <PopoverItem>
                  <Settings size={15} className="text-ink-muted" />
                  Muassasa sozlamalari
                </PopoverItem>
              </Link>
            </>
          )}
        </>
      )}
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* Obuna belgisi                                                       */
/* ------------------------------------------------------------------ */

/** Kunlar bazadagi `trial_ends_at` sanasidan hisoblanadi. */
export function TrialBadge({ daysLeft }: { daysLeft: number | null }) {
  if (daysLeft === null) return null;

  const expired = daysLeft <= 0;
  const urgent = daysLeft <= 3;

  return (
    <Link
      href="/settings"
      className={`hidden shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white transition-colors duration-300 lg:inline-flex ${
        expired
          ? "bg-red-600 hover:bg-red-700"
          : urgent
            ? "bg-amber-500 hover:bg-amber-600"
            : "bg-brand-600 hover:bg-brand-700"
      }`}
    >
      {expired ? "Obuna muddati tugagan" : `Obuna tugashiga ${daysLeft} kun qoldi`}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Til tanlagich                                                       */
/* ------------------------------------------------------------------ */

function UzFlag() {
  return (
    <svg viewBox="0 0 24 16" className="h-3.5 w-5 rounded-[2px]" aria-hidden="true">
      <rect width="24" height="16" fill="#ffffff" />
      <rect width="24" height="5" fill="#0099b5" />
      <rect y="11" width="24" height="5" fill="#1eb53a" />
      <rect y="5" width="24" height="0.7" fill="#ce1126" />
      <rect y="10.3" width="24" height="0.7" fill="#ce1126" />
    </svg>
  );
}

/**
 * Interfeys hozircha faqat o'zbek tilida. Qolgan tillar ro'yxatda
 * ko'rinadi, lekin tarjima tayyor bo'lmagani uchun tanlanmaydi.
 */
export function LanguageMenu() {
  return (
    <Popover
      panelClassName="w-44"
      ariaLabel="Til"
      triggerClassName="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas"
      label={
        <>
          <UzFlag />
          <span>O&apos;zb</span>
          <ChevronDown size={14} className="text-ink-faint" />
        </>
      }
    >
      <PopoverItem className="font-medium">
        <UzFlag />
        O&apos;zbekcha
        <Check size={15} className="ml-auto text-brand-600" />
      </PopoverItem>
      {["Rus tili", "English"].map((lang) => (
        <div
          key={lang}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-faint"
        >
          {lang}
          <span className="ml-auto text-[10px] tracking-wide uppercase">tez orada</span>
        </div>
      ))}
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* Tez qo'shish                                                        */
/* ------------------------------------------------------------------ */

export function QuickAddMenu() {
  const { terms } = useSegment();
  const { can } = usePermissions();

  const allItems: { href: string; label: string; icon: typeof Users; permission: Permission }[] = [
    {
      href: "/education/students/new",
      label: terms.newStudent,
      icon: Users,
      permission: "students.manage",
    },
    {
      href: "/education/groups?new=1",
      label: terms.newGroup,
      icon: Building2,
      permission: "groups.manage",
    },
    {
      href: "/finance/payments",
      label: "To'lov qabul qilish",
      icon: Wallet,
      permission: "payments.manage",
    },
  ];
  const items = allItems.filter((item) => can(item.permission));

  if (items.length === 0) return null;

  return (
    <Popover
      panelClassName="w-56"
      ariaLabel="Tez qo'shish"
      triggerClassName="rounded-lg p-2 text-brand-600 transition-colors hover:bg-canvas"
      label={<Plus size={20} />}
    >
      {(close) =>
        items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={close}>
              <PopoverItem>
                <Icon size={15} className="text-ink-muted" />
                {item.label}
              </PopoverItem>
            </Link>
          );
        })
      }
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* Bildirishnomalar                                                    */
/* ------------------------------------------------------------------ */

/**
 * Bildirishnomalar alohida jadvalga emas, mavjud ma'lumotga tayanadi:
 * qarzdorlar soni va obuna muddati. Shuning uchun ko'rsatkich doim rost.
 */
export function NotificationsMenu({
  debtorCount,
  trialDaysLeft,
}: {
  debtorCount: number;
  trialDaysLeft: number | null;
}) {
  const { terms } = useSegment();
  const { can } = usePermissions();

  const notices: { href: string; text: string; urgent: boolean }[] = [];

  if (debtorCount > 0) {
    notices.push({
      href: "/finance/payments",
      text: `${debtorCount} ta ${terms.student.toLowerCase()}da qarz bor`,
      urgent: true,
    });
  }
  if (can("settings.manage") && trialDaysLeft !== null && trialDaysLeft <= 7) {
    notices.push({
      href: "/settings",
      text:
        trialDaysLeft <= 0
          ? "Obuna muddati tugagan"
          : `Obuna tugashiga ${trialDaysLeft} kun qoldi`,
      urgent: trialDaysLeft <= 3,
    });
  }

  return (
    <Popover
      panelClassName="w-72"
      ariaLabel="Bildirishnomalar"
      triggerClassName={`relative ${ICON_BUTTON}`}
      label={
        <>
          <Bell size={18} />
          {notices.length > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-surface" />
          )}
        </>
      }
    >
      {(close) => (
        <>
          <div className="px-3 py-2 text-xs font-semibold tracking-wide text-ink-faint uppercase">
            Bildirishnomalar
          </div>
          {notices.length === 0 ? (
            <div className="px-3 py-3 text-sm text-ink-faint">
              Yangi bildirishnoma yo&apos;q
            </div>
          ) : (
            notices.map((n) => (
              <Link key={n.text} href={n.href} onClick={close}>
                <PopoverItem>
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      n.urgent ? "bg-red-500" : "bg-brand-500"
                    }`}
                  />
                  {n.text}
                </PopoverItem>
              </Link>
            ))
          )}
        </>
      )}
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* Foydalanuvchi menyusi                                               */
/* ------------------------------------------------------------------ */

export function UserMenu({
  userEmail,
  orgName,
}: {
  userEmail?: string;
  orgName?: string;
}) {
  const signOut = useSignOut();
  const { terms } = useSegment();
  const { can, displayName, roleLabel } = usePermissions();
  const initial = (displayName[0] ?? userEmail?.[0] ?? "F").toUpperCase();

  return (
    <Popover
      panelClassName="w-60"
      ariaLabel="Profil"
      triggerClassName="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      label={initial}
    >
      {(close) => (
        <>
          <div className="px-3 py-2">
            <div className="truncate text-sm font-medium text-ink">
              {displayName}
            </div>
            {userEmail && userEmail !== displayName && (
              <div className="truncate text-xs text-ink-faint">{userEmail}</div>
            )}
            <div className="truncate text-xs text-ink-faint">
              {roleLabel} · {orgName || terms.label}
            </div>
          </div>
          <div className="my-1 border-t border-line" />
          {can("settings.manage") && (
            <Link href="/settings" onClick={close}>
              <PopoverItem>
                <Settings size={15} className="text-ink-muted" />
                Sozlamalar
              </PopoverItem>
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              close();
              void signOut();
            }}
            className="w-full"
          >
            <PopoverItem className="text-red-600">
              <LogOut size={15} />
              Chiqish
            </PopoverItem>
          </button>
        </>
      )}
    </Popover>
  );
}
