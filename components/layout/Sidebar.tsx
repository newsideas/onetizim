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
    <nav className="flex h-full flex-col bg-brand-700">
      {/* Muassasa nomi va turi */}
      <div className="border-b border-white/10 px-4 pt-5 pb-4 text-center">
        <Logo variant="white" className="mb-3 h-10 justify-center" />
        <div className="truncate text-sm font-semibold text-white">
          {orgName || "EduGram"}
        </div>
        <div className="text-xs text-white/50">{terms.label}</div>
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
                  ? "bg-brand-800 text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-3">
        <div className="rounded-lg bg-white/10 px-3 py-2.5 text-center text-xs font-medium tracking-wide text-white/70">
          EduGram system
        </div>
      </div>
    </nav>
  );
}
