"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { buildNavSections, filterNavSections } from "@/lib/navigation";
import { useSegment } from "@/components/layout/SegmentProvider";
import { usePermissions } from "@/components/auth/PermissionsProvider";
import { Logo } from "@/components/ui/Logo";

function matches(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Joriy sahifaga eng aniq mos keladigan havola. "/settings" va
 * "/settings/references/classrooms" ikkalasi ham mos kelsa, uzunrog'i
 * faol hisoblanadi.
 */
function findActiveHref(pathname: string, hrefs: string[]) {
  return hrefs
    .filter((href) => matches(pathname, href))
    .sort((a, b) => b.length - a.length)[0];
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { terms } = useSegment();
  const { permissions, displayName, roleLabel } = usePermissions();

  const sections = useMemo(
    () => filterNavSections(buildNavSections(terms), permissions),
    [terms, permissions],
  );

  const activeHref = findActiveHref(
    pathname,
    sections.flatMap((s) => (s.items ? s.items.map((i) => i.href) : s.href ? [s.href] : [])),
  );

  const activeSection = sections.find((s) => s.items?.some((i) => i.href === activeHref))?.label;

  const [open, setOpen] = useState<Set<string>>(
    () => new Set(activeSection ? [activeSection] : []),
  );

  // Sidebar sahifalar orasida qayta mount bo'lmaydi: boshqa bo'limga
  // o'tilganda o'sha bo'limni ochib qo'yish kerak.
  const [prevActiveSection, setPrevActiveSection] = useState(activeSection);
  if (activeSection !== prevActiveSection) {
    setPrevActiveSection(activeSection);
    if (activeSection && !open.has(activeSection)) {
      setOpen(new Set(open).add(activeSection));
    }
  }

  function toggle(label: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <nav aria-label="Asosiy menyu" className="flex h-full flex-col bg-brand-700">
      <div className="px-5 pt-6 pb-5">
        <Logo variant="white" className="h-12" />
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {sections.map((section) => {
          const Icon = section.icon;

          if (section.href) {
            const active = section.href === activeHref;
            return (
              <Link
                key={section.label}
                href={section.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                {section.label}
              </Link>
            );
          }

          const containsActive = Boolean(section.items?.some((i) => i.href === activeHref));
          const isOpen = open.has(section.label);
          const panelId = `nav-${section.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;

          return (
            <div key={section.label}>
              <button
                type="button"
                onClick={() => toggle(section.label)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  containsActive ? "text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                } ${containsActive && !isOpen ? "bg-white/15" : ""}`}
              >
                <Icon size={18} strokeWidth={2} aria-hidden="true" />
                <span className="flex-1 text-left">{section.label}</span>
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div
                  id={panelId}
                  className="mt-0.5 mb-1 ml-[21px] space-y-0.5 border-l border-white/15"
                >
                  {section.items?.map((item) => {
                    const active = item.href === activeHref;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={`-ml-px block rounded-r-lg border-l-2 py-2 pr-3 pl-4 text-sm transition-colors ${
                          active
                            ? "border-white bg-white/15 font-medium text-white"
                            : "border-transparent text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-3 border-t border-white/10 px-2 pt-3 pb-4">
        <div className="truncate text-sm font-medium text-white" title={displayName}>
          {displayName}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-white/90">{roleLabel}</span>
          <span className="tracking-wide text-white/40">EduGram</span>
        </div>
      </div>
    </nav>
  );
}
