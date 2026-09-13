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

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Bosh sahifa", href: "/", icon: LayoutDashboard },
  { label: "Guruhlar", href: "/groups", icon: BookOpen },
  { label: "O'quvchilar", href: "/students", icon: Users },
  { label: "Davomat", href: "/attendance", icon: CalendarCheck },
  { label: "To'lovlar", href: "/payments", icon: Wallet },
  { label: "Jadval", href: "/schedule", icon: CalendarDays },
  { label: "Sozlamalar", href: "/settings", icon: Settings },
];
