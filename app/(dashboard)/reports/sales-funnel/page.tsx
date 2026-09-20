import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportTable } from "@/components/reports/ReportParts";
import { getOrgMembers } from "@/lib/staff";
import { toIsoDay } from "@/lib/utils/date";
import { LEAD_SOURCES, type LeadStage } from "@/lib/validations/lead";

interface LeadRow {
  stage: LeadStage;
  created_at: string;
  interest: string | null;
  source: string | null;
  assigned_to: string | null;
  teacher_id: string | null;
  trial_date: string | null;
}

const VISITED: LeadStage[] = ["visit", "test", "accepted", "contract", "paid", "enrolled"];

/** Sotuv voronkasi (Edu tizimdagi "Hisobot turlari / Soni / Kurslar soni" jadvali). */
export default async function SalesFunnelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, org } = await requirePermission("leads.manage");

  const [{ data }, members, { data: teachers }, { data: groups }] = await Promise.all([
    supabase.from("leads").select("stage, created_at, interest, source, assigned_to, teacher_id, trial_date"),
    getOrgMembers(supabase, org.id),
    supabase.from("teachers").select("id, full_name").order("full_name"),
    supabase.from("groups").select("name").order("name"),
  ]);

  const leads = ((data ?? []) as LeadRow[]).filter((l) => {
    const created = toIsoDay(l.created_at);
    if (params.from && created < params.from) return false;
    if (params.to && created > params.to) return false;
    if (params.course && l.interest !== params.course) return false;
    if (params.moderator && l.assigned_to !== params.moderator) return false;
    if (params.teacher && l.teacher_id !== params.teacher) return false;
    if (params.source && l.source !== params.source) return false;
    return true;
  });

  const isLost = (l: LeadRow) => l.stage === "lost";
  const reports: { title: string; pick: (l: LeadRow) => boolean }[] = [
    { title: "Barcha buyurtmalar soni", pick: () => true },
    { title: "Buyurtmadan ketganlar", pick: isLost },
    { title: "Sinov darsiga yozilganlar", pick: (l) => Boolean(l.trial_date) || VISITED.includes(l.stage) },
    { title: "Sinov darsiga kelmay ketganlar", pick: (l) => isLost(l) && Boolean(l.trial_date) },
    { title: "Sinov darsiga kelganlar", pick: (l) => VISITED.includes(l.stage) },
    { title: "Sinov darsiga kelib ketganlar", pick: () => false },
    { title: "Birinchi to‘lovni qilganlar", pick: (l) => l.stage === "paid" || l.stage === "enrolled" },
    { title: "Birinchi to‘lovni qilib ketganlar", pick: () => false },
    { title: "Tugatganlar", pick: () => false },
    { title: "Boshqa filialdan ko'chirilgan", pick: () => false },
    { title: "Boshqa filialga ko'chirilgan", pick: () => false },
  ];
  const rows = reports.map((r) => {
    const picked = leads.filter(r.pick);
    return {
      title: r.title,
      count: picked.length,
      courses: new Set(picked.flatMap((l) => (l.interest ? [l.interest] : []))).size,
    };
  });

  return (
    <div className="space-y-4">
      <InlineFilters
        storageKey="sales-funnel"
        configurable={false}
        fields={[
          { name: "from", label: "Sanadan", type: "date", width: "w-40" },
          { name: "to", label: "Sanagacha", type: "date", width: "w-40" },
          { name: "source", label: "Marketing", type: "select", options: LEAD_SOURCES.map((s) => ({ value: s, label: s })) },
          {
            name: "course",
            label: "Kurs",
            type: "select",
            options: (groups ?? []).map((g) => ({ value: g.name as string, label: g.name as string })),
          },
          {
            name: "moderator",
            label: "Moderator",
            type: "select",
            options: members.filter((m) => m.role !== "teacher").map((m) => ({ value: m.userId, label: m.name })),
          },
          {
            name: "teacher",
            label: "O'qituvchi",
            type: "select",
            options: (teachers ?? []).map((t) => ({ value: t.id as string, label: t.full_name as string })),
          },
        ]}
      />
      <ReportTable
        rows={rows}
        rowKey={(r) => r.title}
        columns={[
          { header: "Hisobot turlari", cell: (r) => <span className="font-medium text-ink">{r.title}</span> },
          { header: "Soni", align: "right", cell: (r) => r.count },
          { header: "Kurslar soni", align: "right", cell: (r) => r.courses },
        ]}
      />
    </div>
  );
}
