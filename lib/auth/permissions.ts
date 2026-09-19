/**
 * Rollar va ruxsatlar — yagona manba. Menyu, Proxy va server tekshiruvlari
 * rolni emas, ruxsatni tekshiradi: yangi rol qo'shish faqat shu jadvalni
 * o'zgartirish demakdir.
 *
 * Bu faqat qulaylik va tezkor yo'naltirish qatlami. Haqiqiy himoya —
 * bazadagi RLS (0017–0020 migratsiyalari).
 */

export type Role = "owner" | "manager" | "teacher";

export const ROLES: Role[] = ["owner", "manager", "teacher"];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Direktor",
  manager: "Administrator",
  teacher: "O'qituvchi",
};

export const PERMISSION_LABELS = {
  "dashboard.view": "Bosh sahifa",
  "leads.manage": "Lidlar",
  "students.view": "O'quvchilarni ko'rish",
  "students.manage": "O'quvchilarni qo'shish va tahrirlash",
  "groups.view": "Guruhlarni ko'rish",
  "groups.manage": "Guruhlarni boshqarish",
  "schedule.view": "Dars jadvali",
  "attendance.mark": "Davomat belgilash",
  "grades.manage": "Baholar",
  "payments.manage": "To'lovlar va kassa",
  "contracts.manage": "Shartnomalar",
  "salaries.manage": "Oyliklar",
  "finance.reports": "Balans va moliyaviy hisobot",
  "staff.manage": "Xodimlar va rollar",
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
    "grades.manage",
    "payments.manage",
    "contracts.manage",
    "notifications.manage",
  ],
  teacher: ["dashboard.view", "groups.view", "schedule.view", "attendance.mark", "grades.manage"],
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
  ["/education/students/new", "students.manage"],
  ["/education/students", "students.view"],
  ["/education/parents", "students.view"],
  ["/education/groups/assign", "students.manage"],
  ["/education/groups", "groups.view"],
  ["/education/schedule", "schedule.view"],
  ["/education/attendance", "attendance.mark"],
  ["/education/grades", "grades.manage"],
  ["/finance/payments", "payments.manage"],
  ["/finance/contracts", "contracts.manage"],
  ["/finance/salaries", "salaries.manage"],
  ["/finance/reports", "finance.reports"],
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
