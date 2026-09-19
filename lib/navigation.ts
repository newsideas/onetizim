import {
  Bell,
  Briefcase,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { SegmentTerms } from "@/lib/segment";
import type { Permission } from "@/lib/auth/permissions";
import { referencePath } from "@/lib/references";

export interface NavItem {
  label: string;
  href: string;
  permission: Permission;
}

export interface NavSection {
  label: string;
  icon: LucideIcon;
  /** Ichki menyusiz bo'lim — o'zi sahifa. */
  href?: string;
  permission?: Permission;
  items?: NavItem[];
}

/**
 * Sidebar tuzilmasi — 7 bo'lim. Har band o'z ruxsati bilan: menyu
 * foydalanuvchi ruxsatlari bo'yicha filtrlanadi, Proxy ham shu
 * yo'llardan foydalanadi.
 */
export function buildNavSections(terms: SegmentTerms): NavSection[] {
  return [
    { label: "Bosh sahifa", href: "/", icon: LayoutDashboard, permission: "dashboard.view" },

    { label: "Lidlar", href: "/leads", icon: Target, permission: "leads.manage" },

    {
      label: "O'quv jarayoni",
      icon: GraduationCap,
      items: [
        { label: terms.studentPlural, href: "/education/students", permission: "students.view" },
        { label: terms.groupPlural, href: "/education/groups", permission: "groups.view" },
        { label: terms.schedule, href: "/education/schedule", permission: "schedule.view" },
        { label: "Davomat", href: "/education/attendance", permission: "attendance.mark" },
        { label: "Baholar", href: "/education/grades", permission: "grades.manage" },
      ],
    },

    {
      label: "Moliya",
      icon: Wallet,
      items: [
        { label: "To'lovlar", href: "/finance/payments", permission: "payments.manage" },
        { label: "Shartnomalar", href: "/finance/contracts", permission: "contracts.manage" },
        { label: "Oyliklar", href: "/finance/salaries", permission: "salaries.manage" },
        { label: "Balans va hisobot", href: "/finance/reports", permission: "finance.reports" },
      ],
    },

    {
      label: "Xodimlar",
      icon: Briefcase,
      items: [
        { label: "Xodimlar ro'yxati", href: "/staff", permission: "staff.manage" },
        { label: "Kirish va rollar", href: "/staff/access", permission: "staff.manage" },
      ],
    },

    {
      label: "Xabarnomalar",
      icon: Bell,
      items: [
        { label: "Eslatmalar", href: "/notifications", permission: "notifications.manage" },
        { label: "Telegram bot", href: "/notifications/telegram", permission: "notifications.manage" },
        { label: "SMS", href: "/notifications/sms", permission: "notifications.manage" },
      ],
    },

    {
      label: "Sozlamalar",
      icon: Settings,
      items: [
        { label: "Markaz ma'lumotlari", href: "/settings", permission: "settings.manage" },
        { label: "Xonalar", href: referencePath("classrooms"), permission: "settings.manage" },
        { label: "Fanlar", href: referencePath("subjects"), permission: "settings.manage" },
        { label: "Sinf narxlari", href: referencePath("contract-amounts"), permission: "settings.manage" },
        { label: "Ma'lumotnomalar", href: "/settings/references", permission: "settings.manage" },
      ],
    },
  ];
}

/** Ruxsat yo'q bandlar olib tashlanadi; bandsiz qolgan bo'lim ham ko'rinmaydi. */
export function filterNavSections(
  sections: NavSection[],
  permissions: readonly Permission[],
): NavSection[] {
  const allowed = new Set(permissions);

  return sections.flatMap((section) => {
    if (!section.items) {
      return section.permission && allowed.has(section.permission) ? [section] : [];
    }
    const items = section.items.filter((item) => allowed.has(item.permission));
    return items.length > 0 ? [{ ...section, items }] : [];
  });
}
