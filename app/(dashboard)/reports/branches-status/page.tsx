import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { ReportTable } from "@/components/reports/ReportParts";
import { formatMonth, monthsAgo, nextMonth, parseMonth, todayIso, toIsoDay } from "@/lib/utils/date";

interface LeadRow {
  stage: string;
  trial_date: string | null;
  created_at: string;
}
interface StudentRow {
  id: string;
  status: string;
  balance: number | null;
  group_id: string | null;
  created_at: string;
  archived_at: string | null;
}

/**
 * Filiallar holati (Edu tizimdagi monitoring): buyurtma, yangi va aktiv o'quvchilar, ketganlar, qarzdorlar.
 * O'quvchi va guruhlar hozircha filialga biriktirilmagan, shuning uchun ko'rsatkichlar butun markaz bo'yicha.
 */
export default async function BranchesStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("finance.reports");

  const start = parseMonth(params.month);
  const end = nextMonth(start);
  const today = todayIso();
  const inMonth = (iso: string | null | undefined) => {
    if (!iso) return false;
    const day = toIsoDay(iso);
    return day >= start && day < end;
  };

  const [branchesRes, leadsRes, studentsRes, groupsRes, monthPaymentsRes, oldPaymentsRes] = await Promise.all([
    supabase.from("branches").select("id, name").order("name"),
    supabase.from("leads").select("stage, trial_date, created_at").limit(5000),
    supabase.from("students").select("id, status, balance, group_id, created_at, archived_at").limit(5000),
    supabase.from("groups").select("id, status").limit(2000),
    supabase.from("payments").select("student_id").gte("paid_at", start).lt("paid_at", end).limit(5000),
    supabase.from("payments").select("student_id").lt("paid_at", start).limit(5000),
  ]);

  const branches = (branchesRes.data ?? []) as { id: string; name: string }[];
  const leads = (leadsRes.data ?? []) as LeadRow[];
  const students = (studentsRes.data ?? []) as StudentRow[];
  const groups = (groupsRes.data ?? []) as { id: string; status: string }[];
  const paidBefore = new Set(((oldPaymentsRes.data ?? []) as { student_id: string }[]).map((p) => p.student_id));
  const paidThisMonth = new Set(((monthPaymentsRes.data ?? []) as { student_id: string }[]).map((p) => p.student_id));

  const active = students.filter((s) => s.status === "active");
  const debtors = students.filter((s) => s.status !== "archived" && Number(s.balance ?? 0) < 0);
  const archivedInMonth = students.filter((s) => s.status === "archived" && inMonth(s.archived_at));

  const stats = {
    orders: leads.filter((l) => l.stage !== "lost" && l.stage !== "enrolled").length,
    trial: leads.filter((l) => l.stage !== "lost" && l.trial_date && l.trial_date >= today).length,
    newStudents: students.filter((s) => inMonth(s.created_at)).length,
    active: active.length,
    realActive: active.filter((s) => s.group_id).length,
    inGroups: students.filter((s) => s.status !== "archived" && s.group_id).length,
    lostOrders: leads.filter((l) => l.stage === "lost" && inMonth(l.created_at)).length,
    leftNew: archivedInMonth.filter((s) => inMonth(s.created_at)).length,
    leftActive: archivedInMonth.length,
    debtors: debtors.length,
    groups: groups.filter((g) => g.status === "active").length,
    firstPayers: [...paidThisMonth].filter((id) => !paidBefore.has(id)).length,
    totalStudents: students.length,
    debtorPercent: active.length ? Math.round((debtors.length / active.length) * 100) : 0,
  };

  const single = branches.length <= 1;
  const rows = [{ id: "all", name: single ? (branches[0]?.name ?? "Markaz") : "Barcha filiallar" }];

  const link = "rounded-lg border border-line px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-canvas hover:text-ink";
  const prev = monthsAgo(1, start).slice(0, 7);
  const next = nextMonth(start).slice(0, 7);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/reports/branches-status?month=${prev}`} className={link}>
          ‹
        </Link>
        <span className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white">{formatMonth(start)}</span>
        <Link href={`/reports/branches-status?month=${next}`} className={link}>
          ›
        </Link>
      </div>

      <ReportTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { header: "Filial", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
          { header: "Buyurtma", cell: () => stats.orders },
          { header: "Birinchi darsga keladiganlar", cell: () => stats.trial },
          { header: "Yangi o'quvchi", cell: () => stats.newStudents },
          { header: "Aktiv o'quvchilar", cell: () => stats.active },
          { header: "Jami real bor", cell: () => stats.realActive },
          { header: "Guruh o'quvchilari", cell: () => stats.inGroups },
          { header: "Buyurtmadan ketganlar", cell: () => stats.lostOrders },
          { header: "Yangi o'quvchidan ketganlar", cell: () => stats.leftNew },
          { header: "Aktiv o'quvchidan ketganlar", cell: () => stats.leftActive },
          { header: "Qarzdorlar", cell: () => stats.debtors },
          { header: "Guruh", cell: () => stats.groups },
          { header: "Birinchi to'lovni qilganlar", cell: () => stats.firstPayers },
          { header: "Jami o'quvchi", cell: () => stats.totalStudents },
          { header: "Jami aktiv", cell: () => stats.active },
          { header: "Qarzdorlarning aktivga nisbatan foizi", cell: () => `${stats.debtorPercent}%` },
        ]}
      />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Umumiy natija</h2>
        <ReportTable
          rows={rows}
          rowKey={(r) => r.id}
          columns={[
            { header: "Filial", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
            { header: "Aktiv", cell: () => stats.active },
            { header: "Jami real bor", cell: () => stats.realActive },
          ]}
        />
        {!single && (
          <p className="text-xs text-ink-faint">
            Markazda bir nechta filial bor, lekin o&apos;quvchi va guruhlar hali filialga biriktirilmagan — ko&apos;rsatkichlar
            butun markaz bo&apos;yicha.
          </p>
        )}
      </div>
    </div>
  );
}
