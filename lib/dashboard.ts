import type { SupabaseClient } from "@supabase/supabase-js";
import { MONTH_NAMES, bugungiKun, monthStartIso, todayIso } from "@/lib/utils/date";

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

  const [
    studentsRes,
    debtorsRes,
    paymentsRes,
    chargesRes,
    attendanceRes,
    groupsRes,
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
  const kun = bugungiKun();
  const todayGroups = groupsRaw.filter((g) =>
    g.schedule_days?.includes(kun),
  ).length;

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
  };
}
