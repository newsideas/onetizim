/**
 * Rollar va ruxsatlar — yagona manba. Menyu, Proxy va server tekshiruvlari
 * rolni emas, ruxsatni tekshiradi: yangi rol qo'shish faqat shu jadvalni
 * o'zgartirish demakdir.
 *
 * Bu faqat qulaylik qatlami. Haqiqiy himoya — bazadagi RLS.
 */

export type Role = "owner" | "manager" | "teacher";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Direktor",
  manager: "Administrator",
  teacher: "O'qituvchi",
};

export type Permission =
  | "dashboard.view"
  | "leads.manage"
  | "students.view"
  | "groups.view"
  | "schedule.view"
  | "attendance.mark"
  | "payments.manage"
  | "contracts.manage"
  | "salaries.manage"
  | "finance.reports"
  | "staff.manage"
  | "notifications.manage"
  | "settings.manage";

const ALL: Permission[] = [
  "dashboard.view",
  "leads.manage",
  "students.view",
  "groups.view",
  "schedule.view",
  "attendance.mark",
  "payments.manage",
  "contracts.manage",
  "salaries.manage",
  "finance.reports",
  "staff.manage",
  "notifications.manage",
  "settings.manage",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: ALL,
  manager: [
    "dashboard.view",
    "leads.manage",
    "students.view",
    "groups.view",
    "schedule.view",
    "attendance.mark",
    "payments.manage",
    "contracts.manage",
    "notifications.manage",
  ],
  teacher: ["dashboard.view", "groups.view", "schedule.view", "attendance.mark"],
};

export function permissionsFor(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}
