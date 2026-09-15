import { Users, AlertTriangle, CalendarCheck, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { formatSom } from "@/lib/utils/currency";
import { bugungiKun } from "@/lib/utils/date";


function oyBoshi() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [activeStudents, debtors, todayGroups, monthPayments] = await Promise.all([
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .lt("balance", 0),
    supabase
      .from("groups")
      .select("id", { count: "exact", head: true })
      .contains("schedule_days", [bugungiKun()]),
    supabase.from("payments").select("amount").gte("paid_at", oyBoshi()),
  ]);

  const oylikDaromad = (monthPayments.data ?? []).reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-ink">Bosh sahifa</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Aktiv o'quvchilar"
          value={activeStudents.count ?? 0}
          icon={Users}
          accent="blue"
        />
        <StatCard
          label="Qarzdorlar"
          value={debtors.count ?? 0}
          icon={AlertTriangle}
          accent="red"
        />
        <StatCard
          label={`Bugungi darslar (${bugungiKun()})`}
          value={todayGroups.count ?? 0}
          icon={CalendarCheck}
          accent="amber"
        />
        <StatCard
          label="Oylik daromad"
          value={formatSom(oylikDaromad)}
          icon={Wallet}
          accent="green"
        />
      </div>
    </div>
  );
}
