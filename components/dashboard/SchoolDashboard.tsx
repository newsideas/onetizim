import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Banknote,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import {
  FinanceChart,
  FinancialActivity,
  GroupDistribution,
  ImportantAlerts,
  MonthlyTable,
  QuickActions,
  TodayAttendance,
  type DashboardAlert,
} from "@/components/dashboard/DashboardBlocks";
import { ABSENCE_ALERT_THRESHOLD, getDashboardData } from "@/lib/dashboard";
import type { SegmentTerms } from "@/lib/segment";
import { formatSom } from "@/lib/utils/currency";
import { bugungiKun, formatDate, formatTime, todayIso } from "@/lib/utils/date";

/** Ogohlantirishlarda bir turdan ko'pi bilan shuncha qator ko'rsatiladi. */
const ALERT_LIMIT = 5;

/**
 * Xususiy maktab direktori paneli: bugungi davomat (fan bo'yicha), tushum va qarzdorlik,
 * davomati olinmagan darslar, ko'p dars qoldirayotgan o'quvchilar.
 */
export async function SchoolDashboard({
  supabase,
  terms,
}: {
  supabase: SupabaseClient;
  terms: SegmentTerms;
}) {
  const [data, teachersRes] = await Promise.all([
    getDashboardData(supabase, { school: true }),
    supabase.from("teachers").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);
  const today = todayIso();

  const alerts: DashboardAlert[] = [];
  if (data.lessonAttendanceMissing) {
    alerts.push({
      tone: "red",
      text: "Fan bo'yicha davomat yoqilmagan",
      detail: "0075_lesson_attendance.sql migratsiyasini Supabase SQL Editor'da ishga tushiring",
      href: "/education/attendance",
    });
  }
  for (const l of data.unmarkedLessons.slice(0, ALERT_LIMIT)) {
    alerts.push({
      tone: "amber",
      text: `${l.group_name} · ${l.subject}: davomat olinmagan`,
      detail: `${formatTime(l.start_time)}${l.teacher_name ? ` · ${l.teacher_name}` : ""}`,
      href: `/education/attendance?${new URLSearchParams({ group: l.group_id, date: today, lesson: l.id })}`,
    });
  }
  if (data.unmarkedLessons.length > ALERT_LIMIT) {
    alerts.push({
      tone: "amber",
      text: `Yana ${data.unmarkedLessons.length - ALERT_LIMIT} ta darsda davomat olinmagan`,
      href: "/education/attendance?mark=1",
    });
  }
  if (data.debtorCount > 0) {
    alerts.push({
      tone: "red",
      text: `${data.debtorCount} ta ${terms.student.toLowerCase()} qarzdor`,
      detail: `Jami qarz: ${formatSom(data.totalDebt)}`,
      href: "/finance/payments",
    });
  }
  for (const a of data.frequentAbsentees.slice(0, ALERT_LIMIT)) {
    alerts.push({
      tone: "amber",
      text: `${a.full_name}: 30 kunda ${a.count} kun dars qoldirgan`,
      detail: `${ABSENCE_ALERT_THRESHOLD}+ kun — ota-ona bilan bog'laning`,
      href: `/education/students/${a.id}`,
    });
  }
  if (data.callsDue > 0) {
    alerts.push({
      tone: "amber",
      text: `Qabul: bugun ${data.callsDue} ta ariza bilan bog'lanish kerak`,
      href: "/leads",
    });
  }

  const cards = [
    {
      label: `Aktiv ${terms.studentPlural.toLowerCase()}`,
      value: data.activeStudents,
      icon: UserCheck,
      accent: "green",
      href: "/education/students?status=active",
    },
    { label: terms.groupPlural, value: data.groupCounts.length, icon: Users, accent: "blue", href: "/education/groups" },
    {
      label: "O'qituvchilar",
      value: teachersRes.count ?? 0,
      icon: BookOpen,
      accent: "purple",
      href: "/staff",
    },
    {
      label: "Bugungi darslar",
      value: data.todayGroups,
      icon: CalendarClock,
      accent: "brand",
      href: "/education/schedule",
    },
    {
      label: "Bugungi davomat",
      value: `${data.attendanceToday.percent}%`,
      icon: CalendarCheck,
      accent: data.attendanceToday.percent >= 90 ? "green" : "amber",
      hint: `${data.attendanceToday.absent} ta kelmagan`,
      href: "/education/attendance",
    },
    {
      label: "Shu oy tushum",
      value: formatSom(data.monthRevenue),
      icon: Wallet,
      accent: "green",
      hint: `Bugun: ${formatSom(data.todayPaid)}`,
      href: "/finance/payments",
    },
    {
      label: "Qarzdorlar",
      value: data.debtorCount,
      icon: Banknote,
      accent: "red",
      hint: formatSom(data.totalDebt),
      href: "/finance/payments",
    },
    {
      label: "Shu oy arizalar",
      value: data.newLeadsMonth,
      icon: ClipboardList,
      accent: "amber",
      href: "/leads",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Direktor paneli</h1>
        <p className="text-sm text-ink-muted">
          {formatDate(today)} · {bugungiKun()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
            icon={c.icon}
            accent={c.accent}
            hint={"hint" in c ? c.hint : undefined}
            href={c.href}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ImportantAlerts alerts={alerts} />
        </div>
        <TodayAttendance
          present={data.attendanceToday.present}
          late={data.attendanceToday.late}
          absent={data.attendanceToday.absent}
          percent={data.attendanceToday.percent}
          terms={terms}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FinancialActivity
          debtors={data.topDebtors}
          payments={data.recentPayments}
          debtorCount={data.debtorCount}
          terms={terms}
        />
        <GroupDistribution groups={data.groupCounts} terms={terms} />
      </div>

      {data.months.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <FinanceChart months={data.months} />
          <MonthlyTable months={data.months} />
        </div>
      )}

      <QuickActions terms={terms} />
    </div>
  );
}
