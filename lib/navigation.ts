import {
  LayoutDashboard,
  Contact,
  Globe,
  Users,
  FileText,
  Wallet,
  Briefcase,
  CalendarCheck,
  GraduationCap,
  UserCog,
  MessageSquare,
  Settings,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import type { SegmentTerms } from "@/lib/segment";

export interface NavItem {
  label: string;
  href: string;
}

export interface NavSection {
  label: string;
  icon: LucideIcon;
  /** Bo'lim o'zi sahifa bo'lsa (ichki menyusiz). */
  href?: string;
  items?: NavItem[];
}

/**
 * Sidebar tuzilmasi My School bilan bir xil: 13 bo'lim, ichki menyular
 * bosilganda ochiladi.
 *
 * Bo'lim nomlari muassasa turiga moslashadi — maktabda "Sinflar",
 * bog'cha va o'quv markazda "Guruhlar".
 */
export function buildNavSections(terms: SegmentTerms): NavSection[] {
  return [
    { label: "Bosh sahifa", href: "/", icon: LayoutDashboard },

    {
      label: "CRM",
      icon: Contact,
      items: [
        { label: "Lidlar", href: "/crm/potential-clients" },
        { label: "Hisobotlar", href: "/crm/reports" },
        { label: "Vazifalar", href: "/crm/tasks" },
        { label: "Qo'ng'iroqlar", href: "/crm/calls" },
        { label: "Sozlamalar", href: "/crm/settings" },
        { label: "Target linklari", href: "/crm/target-links" },
      ],
    },

    { label: "Veb sayt", href: "/website", icon: Globe },

    {
      label: terms.studentPlural,
      icon: Users,
      items: [
        { label: `${terms.studentPlural} bazasi`, href: "/students/base" },
        { label: `${terms.studentPlural} ro'yxati`, href: "/students/list" },
        { label: `${terms.student}ni biriktirish`, href: "/students/assign" },
        { label: `${terms.studentPlural} hisoboti`, href: "/students/reports" },
      ],
    },

    {
      label: "Shartnomalar",
      icon: FileText,
      items: [
        { label: "Shartnoma belgilash", href: "/contracts/assign" },
        { label: "To'lov monitoringi", href: "/contracts/payment-monitoring" },
        { label: "Shartnomalar hisoboti", href: "/contracts/reports" },
        { label: "Shartnoma shablonlari", href: "/contracts/demos" },
        { label: "Shartnoma summalari", href: "/contracts/amounts" },
        { label: "Shartnoma turlari", href: "/contracts/types" },
        { label: "Shartnoma chegirmalari", href: "/contracts/discounts" },
        { label: "Bank rekvizitlari", href: "/contracts/audits" },
      ],
    },

    {
      label: "Moliya",
      icon: Wallet,
      items: [
        { label: "Kassa", href: "/cashbox" },
        { label: "Kassa hisoboti", href: "/cashbox-reports" },
        { label: "Kategoriyalar hisoboti", href: "/finance" },
        { label: `${terms.student} to'lovlari`, href: "/receipts" },
        { label: "Xarajatlar", href: "/expenses" },
        { label: "Tushumlar kategoriyasi", href: "/categories-income" },
        { label: "Xarajatlar kategoriyasi", href: "/categories-expense" },
      ],
    },

    {
      label: "HR",
      icon: Briefcase,
      items: [
        { label: "Xodimlar maoshi", href: "/employees-salary" },
        { label: "Xodimlar", href: "/employees-list" },
      ],
    },

    {
      label: "Davomat",
      icon: CalendarCheck,
      items: [
        { label: "Xodimlar", href: "/attendances-employees" },
        { label: terms.studentPlural, href: "/attendances-students" },
        { label: "Turniket sozlamalari", href: "/attendances-turnstile" },
        { label: "Yo'riqnoma", href: "/attendances-guide" },
      ],
    },

    {
      label: "O'quv bo'limi",
      icon: GraduationCap,
      items: [
        { label: terms.schedule, href: "/education/class-schedule" },
        { label: "Hisobotlar", href: "/education/reports" },
        { label: "Imtihonlar", href: "/education/exams" },
        { label: "Mashg'ulot turlari", href: "/education/trainings" },
        { label: "Fanlar", href: "/education/subjects" },
        { label: "Dars vaqtlari", href: "/education/lesson-times" },
        { label: "Akademik davrlar", href: "/education/academic-periods" },
        { label: "Binolar", href: "/education/buildings" },
        { label: "Auditoriyalar", href: "/education/classrooms" },
      ],
    },

    {
      label: "Foydalanuvchilar",
      icon: UserCog,
      items: [
        { label: "Xodimlar", href: "/users/employees" },
        { label: "Ota-onalar", href: "/users/parents" },
      ],
    },

    {
      label: "Xabarnomalar",
      icon: MessageSquare,
      items: [
        { label: "SMS reestrlari", href: "/notifications/reestrs" },
        { label: "Xabarlar", href: "/notifications/messages" },
        { label: "SMS sozlamalari", href: "/notifications/sms-settings" },
      ],
    },

    {
      label: "Sozlamalar",
      icon: Settings,
      items: [
        { label: "O'quv yillari", href: "/settings/academic-years" },
        { label: terms.groupPlural, href: "/settings/classes" },
        { label: `${terms.group} turlari`, href: "/settings/class-types" },
        { label: `${terms.group}ni o'zgartirish`, href: "/settings/class-change" },
        { label: "Smenalar", href: "/settings/smena" },
        { label: "Ta'lim tillari", href: "/settings/academic-languages" },
        { label: "Menyular", href: "/settings/menus" },
        { label: "Muassasa ma'lumotlari", href: "/settings/client-branding" },
      ],
    },

    { label: "Balans", href: "/balance", icon: CreditCard },
  ];
}
