/**
 * Rollar va ruxsatlar — yagona manba. Menyu, Proxy va server tekshiruvlari
 * rolni emas, ruxsatni tekshiradi: yangi rol qo'shish faqat shu jadvalni
 * o'zgartirish demakdir.
 *
 * Bu faqat qulaylik va tezkor yo'naltirish qatlami. Haqiqiy himoya —
 * bazadagi RLS (0017–0020 migratsiyalari).
 */

export type Role = "owner" | "manager" | "teacher" | "accountant";

export const ROLES: Role[] = ["owner", "manager", "teacher", "accountant"];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Direktor",
  manager: "Administrator",
  teacher: "O'qituvchi",
  accountant: "Buxgalter",
};

export const PERMISSION_LABELS = {
  "dashboard.view": "Bosh sahifa",
  "leads.manage": "Qabul (arizalar)",
  "students.view": "O'quvchilarni ko'rish",
  "students.manage": "O'quvchilarni qo'shish va tahrirlash",
  "groups.view": "Guruhlarni ko'rish",
  "groups.manage": "Guruhlarni boshqarish",
  "schedule.view": "Dars jadvali",
  "attendance.mark": "Davomat belgilash (faqat bugun uchun)",
  "attendance.any_date": "Davomatni istalgan kunga belgilash va o'zgartirish",
  "grades.manage": "Baholar",
  "homework.manage": "Uy vazifalari",
  "payments.manage": "To'lovlar va kassa",
  "contracts.manage": "Shartnomalar",
  "salaries.manage": "Oyliklar",
  "finance.reports": "Balans va moliyaviy hisobot",
  "staff.manage": "Xodimlar va rollar",
  "roles.manage": "Rollar va ruxsatlarni belgilash",
  "staff.accounts": "Xodimlar uchun login va parol",
  "notifications.manage": "Xabarnomalar",
  "settings.manage": "Sozlamalar",
} as const;

export type Permission = keyof typeof PERMISSION_LABELS;

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: ALL_PERMISSIONS,
  manager: [
    "dashboard.view",
    "leads.manage",
    "students.view",
    "students.manage",
    "groups.view",
    "groups.manage",
    "schedule.view",
    "attendance.mark",
    "attendance.any_date",
    "grades.manage",
    "homework.manage",
    "payments.manage",
    "contracts.manage",
    "notifications.manage",
    "staff.accounts",
    "roles.manage",
  ],
  teacher: ["dashboard.view", "groups.view", "schedule.view", "attendance.mark", "grades.manage", "homework.manage"],
  // Buxgalter faqat moliya bilan ishlaydi (RLS: 0040_login_accounts.sql).
  accountant: [
    "dashboard.view",
    "students.view",
    "groups.view",
    "payments.manage",
    "contracts.manage",
    "finance.reports",
  ],
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}

export function permissionsFor(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function roleCan(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Bo'lim prefiksi → kerakli ruxsat. Proxy shu jadval bo'yicha tezkor
 * tekshiradi; eng uzun mos prefiks ishlatiladi.
 */
export const ROUTE_PERMISSIONS: [prefix: string, permission: Permission][] = [
  ["/leads", "leads.manage"],
  ["/tasks", "dashboard.view"],
  ["/control", "attendance.mark"],
  ["/reports", "finance.reports"],
  ["/finance/income-expense", "finance.reports"],
  ["/finance/income-plan", "finance.reports"],
  ["/finance/analytics", "finance.reports"],
  ["/finance/pnl", "finance.reports"],
  ["/finance/cashflow", "finance.reports"],
  ["/education/students/new", "students.manage"],
  ["/education/students", "students.view"],
  ["/education/parents", "students.view"],
  ["/education/groups/assign", "students.manage"],
  ["/education/groups/students", "students.view"],
  ["/education/courses", "settings.manage"],
  ["/education/rooms", "groups.view"],
  ["/education/equipment", "groups.view"],
  ["/education/groups", "groups.view"],
  ["/education/schedule", "schedule.view"],
  ["/education/attendance", "attendance.mark"],
  ["/education/grades", "grades.manage"],
  ["/education/homework", "homework.manage"],
  ["/cabinet", "dashboard.view"],
  ["/finance/payments", "payments.manage"],
  ["/finance/contracts", "contracts.manage"],
  ["/finance/salaries", "salaries.manage"],
  ["/finance/reports", "finance.reports"],
  ["/staff/accounts", "staff.accounts"],
  ["/staff/roles", "roles.manage"],
  ["/staff", "staff.manage"],
  ["/notifications", "notifications.manage"],
  ["/settings", "settings.manage"],
  ["/api/contracts", "contracts.manage"],
];

export function permissionForPath(pathname: string): Permission | null {
  let match: [string, Permission] | null = null;
  for (const entry of ROUTE_PERMISSIONS) {
    const [prefix] = entry;
    const hit = pathname === prefix || pathname.startsWith(`${prefix}/`);
    if (hit && (!match || prefix.length > match[0].length)) match = entry;
  }
  return match ? match[1] : null;
}
