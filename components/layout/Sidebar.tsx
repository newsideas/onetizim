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
      <div className="px-5 pt-6 pb-5">
        <Logo variant="white" className="h-12" />
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
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
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
