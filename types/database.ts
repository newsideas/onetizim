/**
 * Supabase jadvallariga mos qo'lda yozilgan tiplar.
 *
 * Supabase loyihasi ulangach, buni almashtirish tavsiya etiladi:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 */

export type OrganizationType = "togarak" | "maktab";
export type SalaryType = "fixed" | "per_lesson" | "percent";
export type StudentStatus = "active" | "archived";
export type AttendanceStatus = "present" | "absent" | "late";
export type PaymentMethod = "naqd" | "karta" | "click" | "payme";

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  owner_id: string | null;
  created_at: string;
}

export interface Teacher {
  id: string;
  org_id: string;
  full_name: string;
  phone: string | null;
  salary_type: SalaryType | null;
  rate: number | null;
  created_at: string;
}

export interface Group {
  id: string;
  org_id: string;
  name: string;
  subject: string | null;
  teacher_id: string | null;
  room: string | null;
  schedule_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  monthly_price: number;
  created_at: string;
}

export interface Student {
  id: string;
  org_id: string;
  group_id: string | null;
  full_name: string;
  phone: string | null;
  parent_telegram_chat_id: number | null;
  balance: number;
  status: StudentStatus;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  group_id: string;
  lesson_date: string;
  status: AttendanceStatus;
  marked_by: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  note: string | null;
  created_at: string;
}

export interface TelegramLink {
  id: string;
  student_id: string;
  chat_id: number;
  linked_at: string;
}
