/**
 * Supabase jadvallariga mos qo'lda yozilgan tiplar.
 *
 * Supabase loyihasi ulangach, buni almashtirish tavsiya etiladi:
 *   npx supabase gen types typescript --project-id <id> > types/database.ts
 */

export type OrganizationType = "togarak" | "maktab";
export type SalaryType = "fixed" | "per_lesson" | "percent";
export type StudentStatus = "active" | "frozen" | "archived";
export type AttendanceStatus = "present" | "absent" | "late";
export type PaymentMethod = "naqd" | "karta" | "click" | "payme" | "terminal";
export type EducationType = "offline" | "online";

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

/** Xona — 0008 migratsiyasigacha groups ichida oddiy matn edi. */
export interface Room {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
}

/** Kurs/Fan — 0008 migratsiyasigacha groups.subject matni edi. */
export interface Course {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
}

export interface Group {
  id: string;
  org_id: string;
  name: string;
  teacher_id: string | null;
  room_id: string | null;
  course_id: string | null;
  schedule_days: string[] | null;
  start_time: string | null;
  end_time: string | null;
  monthly_price: number;
  start_date: string | null;
  end_date: string | null;
  lesson_duration_minutes: number | null;
  education_type: EducationType | null;
  status: "active" | "waiting" | "archived";
  level: string | null;
  telegram_url: string | null;
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

/** Oylik hisob (qarzdorlik) — 0005 migratsiyasi. */
export interface Charge {
  id: string;
  student_id: string;
  group_id: string | null;
  period: string;
  amount: number;
  created_at: string;
}

export interface TelegramLink {
  id: string;
  student_id: string;
  chat_id: number;
  linked_at: string;
}
