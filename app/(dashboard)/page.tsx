import { Users, AlertTriangle, CalendarCheck, Wallet, Coins } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/supabase/getCurrentOrg";
import { getDashboardData } from "@/lib/dashboard";
import { termsFor } from "@/lib/segment";
import { StatCard } from "@/components/ui/StatCard";
import { formatSom } from "@/lib/utils/currency";
import { bugungiKun, formatDate } from "@/lib/utils/date";
import {
  FinancialActivity,
  FinanceChart,
  MonthlyTable,
  OrgCard,
  GroupDistribution,
  TodayAttendance,
  QuickActions,
} from "@/components/dashboard/DashboardBlocks";

export default async function DashboardPage() {
  const supabase = await createClient();
  const org = await getCurrentOrg(supabase);
  const terms = termsFor(org.type);
  const data = await getDashboardData(supabase);

  const director =
    [org.director_last_name, org.director_first_name]
      .filter(Boolean)
      .join(" ") || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Bosh sahifa</h1>
        <p className="text-sm text-ink-muted">
          {formatDate(new Date())} · {bugungiKun()}
        </p>
      </div>

      {/* Umumiy ko'rsatkichlar */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
          Umumiy ko&apos;rsatkichlar
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label={`Aktiv ${terms.studentPlural.toLowerCase()}`}
            value={data.activeStudents}
            icon={Users}
            accent="brand"
            hint={`Jami ${data.totalStudents} ta`}
          />
          <StatCard
            label="Qarzdorlar"
            value={data.debtorCount}
            icon={AlertTriangle}
            accent="red"
            hint={data.totalDebt > 0 ? formatSom(data.totalDebt) : undefined}
          />
          <StatCard
            label="Bugungi to'lov"
            value={formatSom(data.todayPaid)}
            icon={Wallet}
            accent="green"
          />
          <StatCard
            label="Oylik tushum"
            value={formatSom(data.monthRevenue)}
            icon={Coins}
            accent="blue"
          />
          <StatCard
            label={`Bugungi ${terms.lessonPlural.toLowerCase()}`}
            value={data.todayGroups}
            icon={CalendarCheck}
            accent="amber"
            hint={bugungiKun()}
          />
        </div>
      </section>

      {/* Moliyaviy faollik va tahlil */}
      <section className="grid gap-4 xl:grid-cols-2">
        <FinancialActivity
          debtors={data.topDebtors}
          payments={data.recentPayments}
          debtorCount={data.debtorCount}
          terms={terms}
        />
        <FinanceChart months={data.months} />
      </section>

      {/* Oylar kesimida hisob-kitob */}
      <MonthlyTable months={data.months} />

      {/* Muassasa, guruhlar va davomat */}
      <section className="grid gap-4 lg:grid-cols-3">
        <OrgCard
          name={org.name}
          typeLabel={terms.label}
          director={director}
          phone={org.phone ?? null}
          region={org.region ?? null}
          district={org.district ?? null}
        />
        <GroupDistribution groups={data.groupCounts} terms={terms} />
        <TodayAttendance
          present={data.attendanceToday.present}
          late={data.attendanceToday.late}
          absent={data.attendanceToday.absent}
          percent={data.attendanceToday.percent}
          terms={terms}
        />
      </section>

      <QuickActions terms={terms} />
    </div>
  );
}
