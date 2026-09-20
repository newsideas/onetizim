import {
  BookOpen,
  BookOpenCheck,
  Briefcase,
  ChartPie,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { SegmentTerms } from "@/lib/segment";
import type { Permission } from "@/lib/auth/permissions";
import { referencePath } from "@/lib/references";

export interface NavItem {
  label: string;
  /** Sahifasi hali qurilmagan band `href`siz qoladi — menyuda "Tez orada" bo'lib ko'rinadi. */
  href?: string;
  /** Berilmasa bo'limning ruxsati ishlatiladi. */
  permission?: Permission;
  /** Katta menyuda (Moliya, Nazorat, Hisobotlar) ustun sarlavhasi. */
  group?: string;
}

export interface NavSection {
  label: string;
  icon: LucideIcon;
  /** Ichki menyusiz bo'lim — o'zi sahifa. */
  href?: string;
  /** Bo'lim ruxsati; sahifasiz bandlar ham shunga tayanadi. */
  permission: Permission;
  items?: NavItem[];
}

/**
 * Sidebar tuzilmasi Edu tizim bilan bir xil: 12 bo'lim. Menyu foydalanuvchi
 * ruxsatlari bo'yicha filtrlanadi, Proxy ham sahifa yo'llarini shu ruxsatlar
 * bilan tekshiradi. Sahifasi bor bandlar mavjud modullarga ulangan; qolganlari
 * modul qurilganda `href` oladi.
 */
export function buildNavSections(terms: SegmentTerms): NavSection[] {
  const students = terms.studentPlural.toLowerCase();

  return [
    { label: "Topshiriqlar", icon: ClipboardCheck, href: "/tasks", permission: "dashboard.view" },

    {
      label: "Lidlar",
      icon: ClipboardList,
      permission: "leads.manage",
      items: [
        { label: "Buyurtmalar ro'yxati", href: "/leads" },
        { label: "Birinchi darsga yozilganlar", href: "/leads/trial" },
      ],
    },

    {
      label: terms.group,
      icon: Users,
      permission: "groups.view",
      items: [
        { label: terms.group, href: "/education/groups" },
        { label: "Barcha vazifalar", href: "/education/homework", permission: "homework.manage" },
        { label: terms.schedule, href: "/education/schedule", permission: "schedule.view" },
        { label: "Xonalar", href: "/education/rooms" },
        { label: "Jihozlar", href: "/education/equipment" },
        {
          label: `${terms.group} ${students}i`,
          href: "/education/groups/students",
          permission: "students.view",
        },
      ],
    },

    {
      label: terms.studentPlural,
      icon: GraduationCap,
      permission: "students.view",
      items: [
        { label: `Yangi ${students}`, href: "/education/students?view=new" },
        { label: `Aktiv ${students}`, href: "/education/students" },
        { label: `Arxiv ${students}`, href: "/education/students?status=archived" },
        { label: `${terms.studentPlural} ro'yxati`, href: "/education/students/base" },
        { label: "Ota-ona", href: "/education/parents" },
        { label: "Joriy oyda obunasi tugaydiganlar", href: "/education/students/expiring" },
        { label: `${terms.studentPlural} manzillari`, href: "/education/students/addresses" },
      ],
    },

    {
      label: "O'quv bo'limi",
      icon: BookOpen,
      permission: "groups.view",
      items: [
        { label: "Oflayn kurslar", href: referencePath("subjects"), permission: "settings.manage" },
        { label: "Onlayn kurs", href: referencePath("online-courses"), permission: "settings.manage" },
        { label: "Kategoriya", href: referencePath("course-categories"), permission: "settings.manage" },
        { label: "Mavsumiy baholash", href: referencePath("assessments"), permission: "settings.manage" },
        { label: "Baholar jurnali", href: "/education/grades", permission: "grades.manage" },
        { label: "Shartnoma", href: referencePath("contract-templates"), permission: "settings.manage" },
        { label: "Qabul test bazasi", href: referencePath("admission-tests"), permission: "settings.manage" },
      ],
    },

    {
      label: "Blok test",
      icon: BookOpenCheck,
      permission: "grades.manage",
      items: [
        { label: "Blok test turlari", href: referencePath("block-test-types"), permission: "settings.manage" },
        { label: "Blok testlar", href: referencePath("block-tests"), permission: "settings.manage" },
      ],
    },

    {
      label: "Moliya",
      icon: Wallet,
      permission: "payments.manage",
      items: [
        { label: "Kassalar", href: "/finance/payments/cashbox", group: "Amallar" },
        { label: "Bonus", href: referencePath("bonuses"), permission: "settings.manage", group: "Amallar" },
        { label: "Jarima", href: referencePath("fines"), permission: "settings.manage", group: "Amallar" },
        {
          label: "Oylik chiqarish",
          href: "/finance/salaries",
          permission: "salaries.manage",
          group: "Amallar",
        },

        { label: "Kirim chiqim", href: "/finance/income-expense", permission: "finance.reports", group: "Hisobotlar" },
        { label: "Tushum rejasi", href: "/finance/income-plan", permission: "finance.reports", group: "Hisobotlar" },
        { label: "Moliya analitikasi", href: "/finance/analytics", permission: "finance.reports", group: "Hisobotlar" },
        {
          label: "Moliya hisobotlari",
          href: "/finance/reports",
          permission: "finance.reports",
          group: "Hisobotlar",
        },
        { label: "Moliya hisobotlari (P&L)", href: "/finance/pnl", permission: "finance.reports", group: "Hisobotlar" },
        { label: "Pul oqimi", href: "/finance/cashflow", permission: "finance.reports", group: "Hisobotlar" },

        { label: "Tranzaksiya turi", href: referencePath("transaction-types"), permission: "settings.manage", group: "Ma'lumotlar" },
        { label: "Tranzaksiyalar", href: "/finance/payments", group: "Ma'lumotlar" },
        { label: "Rejalashtirilgan xarajatlar", href: referencePath("planned-expenses"), permission: "settings.manage", group: "Ma'lumotlar" },
        {
          label: "Shartnoma",
          href: "/finance/contracts",
          permission: "contracts.manage",
          group: "Ma'lumotlar",
        },
      ],
    },

    {
      label: "Nazorat",
      icon: ShieldCheck,
      permission: "attendance.mark",
      items: [
        { label: "Davomat", href: "/education/attendance", group: "Amallar" },
        { label: "Davomat analitikasi", href: "/control/attendance-analytics", group: "Amallar" },
        { label: "Fikr-mulohaza", href: referencePath("feedback"), permission: "settings.manage", group: "Amallar" },

        { label: "Xodimlar reytingi", href: "/control/staff-rating", group: "Hisobotlar" },
        { label: "Davomat qilinmagan guruhlar", href: "/control/unmarked-groups", group: "Hisobotlar" },
        { label: "Filiallar holati", href: "/reports/branches-status", permission: "finance.reports", group: "Hisobotlar" },
        { label: "Turniket analitikasi", href: "/control/turnstile", group: "Hisobotlar" },
        { label: "Turniket kirish-chiqish analitikasi", href: "/control/turnstile-log", group: "Hisobotlar" },
        { label: "Support analitikasi", href: "/control/support", group: "Hisobotlar" },
      ],
    },

    {
      label: "Boshqaruv",
      icon: Briefcase,
      permission: "staff.accounts",
      items: [
        { label: "Xodimlar", href: "/staff", permission: "staff.manage" },
        { label: "Rollar", href: "/staff/roles", permission: "staff.manage" },
        { label: "Login va parollar", href: "/staff/accounts" },
        { label: "Filiallar", href: referencePath("branches"), permission: "settings.manage" },
        { label: "Ish jadvali", href: referencePath("work-schedules"), permission: "settings.manage" },
      ],
    },

    {
      label: "Sotuv va marketing",
      icon: Megaphone,
      permission: "notifications.manage",
      items: [
        { label: "Marketing", href: referencePath("marketing"), permission: "settings.manage" },
        { label: "Savdo plani", href: referencePath("sales-plans"), permission: "settings.manage" },
        { label: "Yangiliklar", href: referencePath("news"), permission: "settings.manage" },
        { label: "Hikoya", href: referencePath("stories"), permission: "settings.manage" },
        { label: "SMS shablonlari", href: referencePath("sms-templates"), permission: "settings.manage" },
        { label: "Xabarlar ro'yxati", href: "/notifications" },
      ],
    },

    {
      label: "Hisobotlar",
      icon: ChartPie,
      permission: "finance.reports",
      items: [
        { label: "Sotuv voronkasi", href: "/reports/sales-funnel", permission: "leads.manage", group: "Sotuv voronkasi" },

        {
          label: "Balans",
          href: "/finance/reports",
          permission: "finance.reports",
          group: "Moliya",
        },
        { label: "Kirim chiqim", href: "/finance/income-expense", permission: "finance.reports", group: "Moliya" },
        { label: "Tushum rejasi", href: "/finance/income-plan", permission: "finance.reports", group: "Moliya" },
        { label: `${terms.student}ning umumiy to'lanmagan summasi`, href: "/reports/unpaid", permission: "finance.reports", group: "Moliya" },
        { label: "Kurs narxidan farqli to'lovlar tranzaksiyasi", href: "/reports/price-mismatch", permission: "finance.reports", group: "Moliya" },
        { label: "Bekor qilingan to'lovlar", href: "/reports/cancelled-payments", permission: "finance.reports", group: "Moliya" },
        { label: "Umumiy chegirmalar", href: "/reports/discounts", permission: "finance.reports", group: "Moliya" },
        { label: "O'quv markazga ishlab berilgan pul", href: "/reports/earned", permission: "finance.reports", group: "Moliya" },

        {
          label: `${terms.studentPlural} hisoboti`,
          href: "/education/students/reports",
          permission: "students.view",
          group: "O'quv",
        },
        { label: "O'qituvchilar samaradorligi", href: "/control/staff-rating", permission: "attendance.mark", group: "O'quv" },
        { label: "Administratorlar samaradorligi", href: "/reports/managers", permission: "leads.manage", group: "O'quv" },
        { label: "Ketish sabablari", href: "/reports/leave-reasons", permission: "finance.reports", group: "O'quv" },
        { label: "Xonalar analitikasi", href: "/education/rooms?tab=analytics", permission: "groups.view", group: "O'quv" },
        { label: "Davomati bekor qilinganlar analitikasi", href: "/control/absences", permission: "attendance.mark", group: "O'quv" },

        { label: "Filiallar holati", href: "/reports/branches-status", permission: "finance.reports", group: "Nazorat" },
        { label: "Xodimlar reytingi", href: "/control/staff-rating", permission: "attendance.mark", group: "Nazorat" },
        { label: "Davomat qilinmagan guruhlar", href: "/control/unmarked-groups", permission: "attendance.mark", group: "Nazorat" },
      ],
    },

    {
      label: "Sozlamalar",
      icon: Settings,
      permission: "settings.manage",
      items: [
        { label: "Umumiy sozlamalar", href: "/settings" },
        { label: "Moliya", href: "/settings/references?group=finance" },
        { label: "O'quv", href: "/settings/references?group=education" },
        { label: "Sotuv va marketing", href: "/settings/references?group=marketing" },
        { label: "Boshqaruv", href: "/settings/references?group=management" },
        { label: "Blok test", href: "/settings/references?group=block-test" },
        { label: "Umumiy ma'lumotnomalar", href: "/settings/references" },
        { label: "Integratsiyalar", href: "/notifications/telegram" },
        { label: "Ilova sozlamalari", href: referencePath("app-settings") },
        { label: "Gamifikatsiya", href: referencePath("gamification") },
      ],
    },
  ];
}

/**
 * Ruxsat yo'q bandlar olib tashlanadi; bandsiz qolgan bo'lim ham ko'rinmaydi.
 * Sahifasiz ("Tez orada") bo'limlar ham bo'lim ruxsati bo'yicha ko'rinadi.
 */
export function filterNavSections(
  sections: NavSection[],
  permissions: readonly Permission[],
): NavSection[] {
  const allowed = new Set(permissions);

  return sections.flatMap((section) => {
    if (!allowed.has(section.permission)) return [];
    if (!section.items) return [section];

    const items = section.items.filter((item) => allowed.has(item.permission ?? section.permission));
    return items.length > 0 ? [{ ...section, items }] : [];
  });
}
