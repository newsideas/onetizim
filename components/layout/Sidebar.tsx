"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildNavItems } from "@/lib/navigation";
import { useSegment } from "@/components/layout/SegmentProvider";
import { Logo } from "@/components/ui/Logo";

export function Sidebar({
  onNavigate,
  orgName,
}: {
  onNavigate?: () => void;
  orgName?: string;
}) {
  const pathname = usePathname();
  const { terms } = useSegment();
  const navItems = buildNavItems(terms);

  return (
    <nav className="flex h-full flex-col bg-surface">
      {/* Muassasa nomi va turi */}
      <div className="border-b border-line px-4 pt-5 pb-4 text-center">
        <Logo className="mb-3 h-24 justify-center" />
        <div className="truncate text-sm font-semibold text-ink">
          {orgName || "EduGram"}
        </div>
        <div className="text-xs text-ink-faint">{terms.label}</div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="border-t border-line px-4 py-3">
        <div className="text-xs text-ink-faint">EduGram system</div>
      </div>
    </nav>
  );
}
