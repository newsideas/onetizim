import type { NextConfig } from "next";

/** Eski (My School tuzilmasidagi) manzillar → yangi 7 bo'limli tuzilma. */
const MOVED: [string, string][] = [
  ["/students/list", "/education/students"],
  ["/students/new", "/education/students/new"],
  ["/students/base", "/education/students/base"],
  ["/students/reports", "/education/students/reports"],
  ["/students/assign", "/education/groups/assign"],
  ["/students/:id", "/education/students/:id"],
  ["/settings/classes", "/education/groups"],
  ["/groups/:id", "/education/groups/:id"],
  ["/education/class-schedule", "/education/schedule"],
  ["/attendances-students", "/education/attendance"],
  ["/receipts", "/finance/payments"],
  ["/contracts/assign", "/finance/contracts"],
  ["/employees-salary", "/finance/salaries"],
  ["/balance", "/finance/reports"],
  ["/crm/potential-clients", "/leads"],
  ["/employees-list", "/staff"],
  ["/notifications/messages", "/notifications"],
  ["/notifications/sms-settings", "/notifications/sms"],
  ["/settings/telegram", "/notifications/telegram"],
  ["/settings/client-branding", "/settings"],

  ["/settings/academic-years", "/settings/references/academic-years"],
  ["/settings/class-types", "/settings/references/class-types"],
  ["/settings/smena", "/settings/references/shifts"],
  ["/settings/academic-languages", "/settings/references/academic-languages"],
  ["/education/buildings", "/settings/references/buildings"],
  ["/education/classrooms", "/settings/references/classrooms"],
  ["/education/subjects", "/settings/references/subjects"],
  ["/education/lesson-times", "/settings/references/lesson-times"],
  ["/education/academic-periods", "/settings/references/academic-periods"],
  ["/education/trainings", "/settings/references/trainings"],
  ["/contracts/types", "/settings/references/contract-types"],
  ["/contracts/discounts", "/settings/references/contract-discounts"],
  ["/contracts/audits", "/settings/references/bank-accounts"],
  ["/contracts/amounts", "/settings/references/contract-amounts"],
];

/** Arxivlangan (hali qurilmagan) sahifalar — eng yaqin bo'limga. */
const ARCHIVED: [string, string][] = [
  ["/crm/:path*", "/leads"],
  ["/contracts/:path*", "/finance/contracts"],
  ["/website", "/"],
  ["/education/reports", "/education/students/reports"],
  ["/education/exams", "/education/students"],
  ["/attendances-:rest", "/education/attendance"],
  ["/users/:path*", "/staff"],
  ["/notifications/reestrs", "/notifications"],
  ["/settings/menus", "/settings"],
  ["/settings/class-change", "/education/groups/assign"],
  ["/categories-:rest", "/finance/reports"],
  ["/cashbox-reports", "/finance/reports"],
  ["/cashbox", "/finance/payments"],
  ["/expenses", "/finance/payments"],
  ["/education", "/education/students"],
  ["/finance", "/finance/payments"],
  ["/settings/references", "/settings/references/academic-years"],
];

const nextConfig: NextConfig = {
  // Tuzilma hali o'zgarishi mumkin — brauzer keshlab qolmasligi uchun 307.
  async redirects() {
    return [...MOVED, ...ARCHIVED].map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
};

export default nextConfig;
