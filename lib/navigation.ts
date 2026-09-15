import {
  LayoutDashboard,
  BookOpen,
  Users,
  CalendarCheck,
  Wallet,
  CalendarDays,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { SegmentTerms } from "@/lib/segment";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Sidebar bo'limlari muassasa turiga qarab nomlanadi:
 * maktabda "Sinflar", bog'chada "Bolalar", markazda "Guruhlar".
 */
export function buildNavItems(terms: SegmentTerms): NavItem[] {
  return [
    { label: "Bosh sahifa", href: "/", icon: LayoutDashboard },
    { label: terms.groupPlural, href: "/groups", icon: BookOpen },
    { label: terms.studentPlural, href: "/students", icon: Users },
    { label: "Davomat", href: "/attendance", icon: CalendarCheck },
    { label: "To'lovlar", href: "/payments", icon: Wallet },
    { label: terms.schedule, href: "/schedule", icon: CalendarDays },
    { label: "Sozlamalar", href: "/settings", icon: Settings },
  ];
}
