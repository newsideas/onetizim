"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { buildNavSections, type NavSection } from "@/lib/navigation";
import { useSegment } from "@/components/layout/SegmentProvider";
import { Logo } from "@/components/ui/Logo";

/** Havola joriy sahifaga mos keladimi? */
function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function sectionHasActive(pathname: string, section: NavSection) {
  if (section.href) return isActive(pathname, section.href);
  return Boolean(section.items?.some((i) => isActive(pathname, i.href)));
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { terms } = useSegment();
  const sections = buildNavSections(terms);

  // Joriy sahifa qaysi bo'limda bo'lsa, o'sha bo'lim ochiq turadi.
  const [open, setOpen] = useState<Set<string>>(
    () =>
      new Set(
        sections
          .filter((s) => s.items && sectionHasActive(pathname, s))
          .map((s) => s.label),
      ),
  );

  function toggle(label: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <nav className="flex h-full flex-col bg-brand-700">
      <div className="px-5 pt-6 pb-5">
        <Logo variant="white" className="h-12" />
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {sections.map((section) => {
          const Icon = section.icon;
          const active = sectionHasActive(pathname, section);

          // Ichki menyusiz bo'lim — oddiy havola.
          if (section.href) {
            return (
              <Link
                key={section.label}
                href={section.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                {section.label}
              </Link>
            );
          }

          const isOpen = open.has(section.label);

          return (
            <div key={section.label}>
              <button
                type="button"
                onClick={() => toggle(section.label)}
                aria-expanded={isOpen}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                <span className="flex-1 text-left">{section.label}</span>
                <ChevronDown
                  size={14}
                  className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && (
                <div className="mt-0.5 mb-1 ml-4 space-y-0.5 border-l border-white/15 pl-3">
                  {section.items?.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive(pathname, item.href)
                          ? "bg-white/15 font-medium text-white"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-4 border-t border-white/10 pt-3 pb-4">
        <div className="text-center text-xs tracking-wide text-white/40">
          EduGram system
        </div>
      </div>
    </nav>
  );
}
