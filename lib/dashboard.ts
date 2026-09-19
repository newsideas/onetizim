import type { SupabaseClient } from "@supabase/supabase-js";
import {
  HAFTA_KUNLARI,
  MONTH_NAMES,
  bugungiKun,
  monthStartIso,
  toIsoDay,
  todayIso,
} from "@/lib/utils/date";
import { CLOSED_LEAD_STAGES, type LeadStage } from "@/lib/validations/lead";

/**
 * Bosh sahifa uchun barcha ko'rsatkichlar bitta joyda yig'iladi.
 * Sahifa faqat chizish bilan shug'ullanadi.
 */

export interface DebtorRow {
  id: string;
  full_name: string;
  balance: number;
  group_name: string | null;
}

export interface RecentPayment {
  id: string;
  amount: number;
  paid_at: string;
  student_name: string;
}

export interface MonthRow {
  /** Oyning 1-sanasi (YYYY-MM-DD) */
  period: string;
  label: string;
  charged: number;
  paid: number;
  debt: number;
  /** To'lov foizi (0–100) */
  percent: number;
}

export interface GroupCount {
  name: string;
  count: number;
}

export interface FrequentAbsentee {
  id: string;
  full_name: string;
  count: number;
}

/** Shu davrda (kun) necha marta dars qoldirilsa ogohlantirish chiqadi. */
export const ABSENCE_ALERT_THRESHOLD = 3;
const ABSENCE_WINDOW_DAYS = 30;

export interface DashboardData {
  activeStudents: number;
  totalStudents: number;
  debtorCount: number;
  totalDebt: number;
  todayPaid: number;
  monthRevenue: number;
  todayGroups: number;
  attendanceToday: {
    present: number;
    late: number;
    absent: number;
    percent: number;
  };
  topDebtors: DebtorRow[];
  recentPayments: RecentPayment[];
  months: MonthRow[];
  groupCounts: GroupCount[];
  newLeadsMonth: number;
  callsDue: number;
  frequentAbsentees: FrequentAbsentee[];
}

/** Joriy o'quv yili boshi (1-sentabr), YYYY-MM-DD. */
function academicYearStart(today: string): string {
  const [year, month] = today.split("-").map(Number);
  return `${month >= 9 ? year : year - 1}-09-01`;
}

export async function getDashboardData(
  supabase: SupabaseClient,
): Promise<DashboardData> {
  const today = todayIso();
  const yearStart = academicYearStart(today);
  const monthStart = monthStartIso();
  const absenceFrom = toIsoDay(new Date(Date.now() - ABSENCE_WINDOW_DAYS * 86_400_000));

  const [
    studentsRes,
    debtorsRes,
    paymentsRes,
    chargesRes,
    attendanceRes,
    groupsRes,
    lessonsRes,
    leadsRes,
    absencesRes,
  ] = await Promise.all([
    supabase.from("students").select("id, status"),
    supabase
      .from("students")
      .select("id, full_name, balance, group:groups(name)")
      .lt("balance", 0)
      .order("balance"),
    supabase
      .from("payments")
      .select("id, amount, paid_at, student:students(full_name)")
      .gte("paid_at", yearStart)
      .order("paid_at", { ascending: false }),
    supabase.from("charges").select("period, amount").gte("period", yearStart),
    supabase.from("attendance").select("status").eq("lesson_date", today),
    supabase
      .from("groups")
      .select("id, name, schedule_days, students(id)")
      .order("name"),
    supabase.from("lessons").select("group_id, weekday"),
    supabase.from("leads").select("stage, created_at, next_contact_on"),
    supabase
      .from("attendance")
      .select("student_id, student:students(full_name)")
      .eq("status", "absent")
      .gte("lesson_date", absenceFrom),
  ]);

  const students = studentsRes.data ?? [];
  const activeStudents = students.filter((s) => s.status === "active").length;

  // Qarzdorlar
  const debtorsRaw = (debtorsRes.data ?? []) as unknown as {
    id: string;
    full_name: string;
    balance: number;
    group: { name: string } | null;
  }[];
  const topDebtors: DebtorRow[] = debtorsRaw.slice(0, 5).map((d) => ({
    id: d.id,
    full_name: d.full_name,
    balance: Number(d.balance),
    group_name: d.group?.name ?? null,
  }));
  const totalDebt = debtorsRaw.reduce(
    (sum, d) => sum + Math.abs(Number(d.balance)),
    0,
  );

  // To'lovlar
  const paymentsRaw = (paymentsRes.data ?? []) as unknown as {
    id: string;
    amount: number;
    paid_at: string;
    student: { full_name: string } | null;
  }[];
  const todayPaid = paymentsRaw
    .filter((p) => p.paid_at === today)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const monthRevenue = paymentsRaw
    .filter((p) => p.paid_at >= monthStart)
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const recentPayments: RecentPayment[] = paymentsRaw.slice(0, 5).map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    paid_at: p.paid_at,
    student_name: p.student?.full_name ?? "—",
  }));

  // Oylar kesimi: hisoblangan (charges) va to'langan (payments)
  const charges = (chargesRes.data ?? []) as { period: string; amount: number }[];
  const byMonth = new Map<string, { charged: number; paid: number }>();

  for (const c of charges) {
    const key = c.period.slice(0, 7);
    const row = byMonth.get(key) ?? { charged: 0, paid: 0 };
    row.charged += Number(c.amount);
    byMonth.set(key, row);
  }
  for (const p of paymentsRaw) {
    const key = p.paid_at.slice(0, 7);
    const row = byMonth.get(key) ?? { charged: 0, paid: 0 };
    row.paid += Number(p.amount);
    byMonth.set(key, row);
  }

  const months: MonthRow[] = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const monthIndex = Number(key.slice(5, 7)) - 1;
      const debt = Math.max(0, v.charged - v.paid);
      return {
        period: `${key}-01`,
        label: MONTH_NAMES[monthIndex] ?? key,
        charged: v.charged,
        paid: v.paid,
        debt,
        percent: v.charged > 0 ? Math.round((v.paid / v.charged) * 100) : 0,
      };
    });

  // Bugungi davomat
  const attendance = (attendanceRes.data ?? []) as { status: string }[];
  const present = attendance.filter((a) => a.status === "present").length;
  const late = attendance.filter((a) => a.status === "late").length;
  const absent = attendance.filter((a) => a.status === "absent").length;
  const marked = present + late + absent;

  // Guruhlar bo'yicha o'quvchilar soni va bugungi darslar
  const groupsRaw = (groupsRes.data ?? []) as unknown as {
    id: string;
    name: string;
    schedule_days: string[] | null;
    students: { id: string }[];
  }[];
  const groupCounts: GroupCount[] = groupsRaw.map((g) => ({
    name: g.name,
    count: g.students?.length ?? 0,
  }));
  // Bugungi darslar: dars jadvali (lessons) + jadvali kiritilmagan sinflarning eski kun/vaqti.
  const kun = bugungiKun();
  const weekday = (HAFTA_KUNLARI as readonly string[]).indexOf(kun) + 1;
  const lessonRows = (lessonsRes.data ?? []) as { group_id: string; weekday: number }[];
  const groupsWithLessons = new Set(lessonRows.map((l) => l.group_id));
  const todayGroups =
    lessonRows.filter((l) => l.weekday === weekday).length +
    groupsRaw.filter((g) => !groupsWithLessons.has(g.id) && g.schedule_days?.includes(kun)).length;

  // Qabul: shu oy yangi arizalar va bugun bog'lanish kerak bo'lganlar
  const leadRows = (leadsRes.data ?? []) as {
    stage: LeadStage;
    created_at: string;
    next_contact_on: string | null;
  }[];
  const newLeadsMonth = leadRows.filter((l) => l.created_at.slice(0, 10) >= monthStart).length;
  const callsDue = leadRows.filter(
    (l) => l.next_contact_on && l.next_contact_on <= today && !CLOSED_LEAD_STAGES.includes(l.stage),
  ).length;

  // So'nggi 30 kunda 3+ marta dars qoldirganlar
  const absenceRows = (absencesRes.data ?? []) as unknown as {
    student_id: string;
    student: { full_name: string } | null;
  }[];
  const absenceCounts = new Map<string, FrequentAbsentee>();
  for (const a of absenceRows) {
    const row = absenceCounts.get(a.student_id) ?? {
      id: a.student_id,
      full_name: a.student?.full_name ?? "—",
      count: 0,
    };
    row.count += 1;
    absenceCounts.set(a.student_id, row);
  }
  const frequentAbsentees = [...absenceCounts.values()]
    .filter((r) => r.count >= ABSENCE_ALERT_THRESHOLD)
    .sort((a, b) => b.count - a.count);

  return {
    activeStudents,
    totalStudents: students.length,
    debtorCount: debtorsRaw.length,
    totalDebt,
    todayPaid,
    monthRevenue,
    todayGroups,
    attendanceToday: {
      present,
      late,
      absent,
      percent: marked > 0 ? Math.round(((present + late) / marked) * 100) : 0,
    },
    topDebtors,
    recentPayments,
    months,
    groupCounts,
    newLeadsMonth,
    callsDue,
    frequentAbsentees,
  };
}
