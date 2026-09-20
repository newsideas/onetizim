"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildNavSections,
  filterNavSections,
  type NavItem,
  type NavSection,
} from "@/lib/navigation";
import { useSegment } from "@/components/layout/SegmentProvider";
import { usePermissions } from "@/components/auth/PermissionsProvider";
import { Logo } from "@/components/ui/Logo";
import { initials } from "@/lib/staff";

function matches(pathname: string, path: string) {
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * Havola joriy sahifaga qanchalik mos: yo'l uzunroq bo'lsa va so'rov
 * parametrlari (masalan `?status=archived`) ham mos kelsa — yuqoriroq.
 * Mos kelmasa null.
 */
function matchScore(pathname: string, search: URLSearchParams, href: string): number | null {
  const [path, query = ""] = href.split("?");
  if (!matches(pathname, path)) return null;

  const params = [...new URLSearchParams(query)];
  for (const [key, value] of params) {
    if (search.get(key) !== value) return null;
  }
  return path.length * 10 + params.length;
}

const itemKey = (section: NavSection, item?: NavItem) =>
  item ? `${section.label}/${item.label}` : section.label;

/**
 * Joriy sahifaga eng aniq mos band. Ikki bo'limda bir xil sahifa bo'lsa
 * (masalan "Shartnoma") birinchisi faol hisoblanadi.
 */
function findActiveKey(
  pathname: string,
  search: URLSearchParams,
  sections: NavSection[],
): string | null {
  let best: { key: string; score: number } | null = null;

  for (const section of sections) {
    const candidates: [string, string | undefined][] = section.items
      ? section.items.map((item) => [itemKey(section, item), item.href])
      : [[itemKey(section), section.href]];

    for (const [key, href] of candidates) {
      if (!href) continue;
      const score = matchScore(pathname, search, href);
      if (score !== null && (!best || score > best.score)) best = { key, score };
    }
  }
  return best?.key ?? null;
}

const ITEM_BASE =
  "relative flex w-full items-center gap-2.5 rounded-lg py-2 text-[13px] font-semibold transition-colors duration-200";
const ITEM_ACTIVE =
  "bg-brand-50 text-brand-600 before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-brand-600 dark:bg-brand-600/15 dark:text-brand-400";
const ITEM_IDLE = "text-ink hover:bg-canvas";
const ITEM_SOON = "cursor-default text-ink-faint";

const SOON_HINT = "Tez orada";

/** Sichqoncha ketgach ichki bandlar oynasi yopilishidan oldingi kechikish. */
const CLOSE_DELAY_MS = 180;

/** Ichki bandlar oynasining ekran chetidan qoldiradigan oralig'i. */
const FLY_MARGIN = 8;

interface FlyPos {
  left: number;
  /** Yuqori bo'limlar tepadan, pastdagilari (Hisobotlar, Sozlamalar) pastdan hizalanadi. */
  top?: number;
  bottom?: number;
}

/** Bandlarni `group` bo'yicha ustunlarga ajratadi; guruhsiz bo'lsa bitta ustun. */
function toColumns(items: NavItem[]): { title: string | null; items: NavItem[] }[] {
  const columns: { title: string | null; items: NavItem[] }[] = [];
  for (const item of items) {
    const title = item.group ?? null;
    const column = columns.find((c) => c.title === title);
    if (column) column.items.push(item);
    else columns.push({ title, items: [item] });
  }
  return columns;
}

export function Sidebar({
  onNavigate,
  collapsed = false,
  onToggleCollapsed,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { terms } = useSegment();
  const { permissions, displayName, roleLabel } = usePermissions();

  const sections = useMemo(
    () => filterNavSections(buildNavSections(terms), permissions),
    [terms, permissions],
  );

  const activeKey = findActiveKey(pathname, searchParams, sections);

  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const [flyPos, setFlyPos] = useState<FlyPos>({ top: 0, left: 0 });
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);

  // Sahifa almashsa ichki bandlar oynasi yopiladi.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpenLabel(null);
  }

  // Menyudan tashqariga bosilsa yoki Escape bosilsa yopiladi.
  useEffect(() => {
    if (!openLabel) return;
    function onDown(e: globalThis.MouseEvent) {
      const target = e.target as Node;
      if (navRef.current?.contains(target) || flyRef.current?.contains(target)) return;
      setOpenLabel(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenLabel(null);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openLabel]);

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenLabel(null), CLOSE_DELAY_MS);
  }

  function openFor(label: string, el: HTMLElement) {
    cancelClose();
    const rect = el.getBoundingClientRect();
    const left = rect.right + 6;
    // Katta menyu ekrandan chiqib ketmasligi uchun pastki yarmidagi bo'limlar pastdan hizalanadi.
    setFlyPos(
      rect.top > window.innerHeight / 2
        ? { left, bottom: Math.max(FLY_MARGIN, window.innerHeight - rect.bottom) }
        : { left, top: rect.top },
    );
    setOpenLabel(label);
  }

  function onSectionClick(section: NavSection, e: MouseEvent<HTMLButtonElement>) {
    // Sichqonchada menyu hover bilan allaqachon ochiladi — bosish uni yopmasligi kerak.
    // Faqat sensorli qurilmada (hover yo'q) bosish menyuni almashtiradi.
    const canHover = window.matchMedia("(hover: hover)").matches;
    if (!canHover && openLabel === section.label) return setOpenLabel(null);
    openFor(section.label, e.currentTarget);
  }

  const openSection = sections.find((s) => s.label === openLabel);
  const itemPadding = collapsed ? "justify-center px-0" : "px-3";

  return (
    <nav ref={navRef} aria-label="Asosiy menyu" className="relative flex h-full flex-col bg-surface">
      <div className={`flex h-14 shrink-0 items-center ${collapsed ? "justify-center" : "px-4"}`}>
        <Link href="/" aria-label="Bosh sahifa" title="Bosh sahifa" className="flex items-center">
          {collapsed ? (
            <span className="block h-6 w-6 overflow-hidden">
              <Logo variant="brand" className="h-6" />
            </span>
          ) : (
            <Logo variant="brand" className="h-6" />
          )}
        </Link>
      </div>

      {onToggleCollapsed && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Menyuni yoyish" : "Menyuni yig'ish"}
          title={collapsed ? "Menyuni yoyish" : "Menyuni yig'ish"}
          className="absolute top-[46px] -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-ink-muted shadow-sm transition-colors duration-200 hover:text-brand-600"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}

      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const label = (
            <span className={collapsed ? "sr-only" : "truncate"}>{section.label}</span>
          );

          if (section.href) {
            const active = itemKey(section) === activeKey;
            return (
              <Link
                key={section.label}
                href={section.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? section.label : undefined}
                className={`${ITEM_BASE} ${itemPadding} ${active ? ITEM_ACTIVE : ITEM_IDLE}`}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" className="shrink-0" />
                {label}
              </Link>
            );
          }

          // Sahifasi ham, ichki bandi ham yo'q bo'lim — hali qurilmagan.
          if (!section.items) {
            return (
              <span
                key={section.label}
                aria-disabled="true"
                title={`${section.label} — ${SOON_HINT.toLowerCase()}`}
                className={`${ITEM_BASE} ${itemPadding} ${ITEM_SOON}`}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" className="shrink-0" />
                {label}
              </span>
            );
          }

          const containsActive = section.items.some((i) => itemKey(section, i) === activeKey);
          const isOpen = openLabel === section.label;

          return (
            <button
              key={section.label}
              type="button"
              onClick={(e) => onSectionClick(section, e)}
              onMouseEnter={(e) => {
                if (window.matchMedia("(hover: hover)").matches) openFor(section.label, e.currentTarget);
              }}
              onMouseLeave={scheduleClose}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              title={collapsed ? section.label : undefined}
              className={`${ITEM_BASE} ${itemPadding} ${containsActive || isOpen ? ITEM_ACTIVE : ITEM_IDLE}`}
            >
              <Icon size={18} strokeWidth={2} aria-hidden="true" className="shrink-0" />
              {label}
            </button>
          );
        })}
      </div>

      <div className={`shrink-0 border-t border-line py-3 ${collapsed ? "flex justify-center" : "px-4"}`}>
        {collapsed ? (
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white"
            title={`${displayName} · ${roleLabel}`}
          >
            {initials(displayName)}
          </span>
        ) : (
          <>
            <div className="truncate text-[13px] font-semibold text-ink" title={displayName}>
              {displayName}
            </div>
            <div className="mt-0.5 truncate text-xs text-ink-muted">{roleLabel}</div>
          </>
        )}
      </div>

      {openSection?.items && (
        <div
          ref={flyRef}
          role="menu"
          aria-label={openSection.label}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            top: flyPos.top,
            bottom: flyPos.bottom,
            left: flyPos.left,
            maxHeight: `calc(100vh - ${FLY_MARGIN * 2}px)`,
          }}
          className="fixed z-50 flex max-w-[calc(100vw-200px)] animate-[edu-pop_150ms_var(--ease-edu)] gap-1 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-lg"
        >
          {toColumns(openSection.items).map((column) => (
            <div key={column.title ?? "all"} className="min-w-[190px] flex-1">
              {column.title && (
                <div className="px-3 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
                  {column.title}
                </div>
              )}
              {column.items.map((item) => {
                if (!item.href) {
                  return (
                    <span
                      key={item.label}
                      role="menuitem"
                      aria-disabled="true"
                      title={SOON_HINT}
                      className={`block rounded-lg px-3 py-2 text-[13px] font-medium ${ITEM_SOON}`}
                    >
                      {item.label}
                    </span>
                  );
                }

                const active = itemKey(openSection, item) === activeKey;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    role="menuitem"
                    onClick={() => {
                      setOpenLabel(null);
                      onNavigate?.();
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-200 ${
                      active
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-400"
                        : "text-ink hover:bg-canvas"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}
