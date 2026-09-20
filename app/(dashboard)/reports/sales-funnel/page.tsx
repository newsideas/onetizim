import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportCards } from "@/components/reports/ReportParts";
import { toIsoDay } from "@/lib/utils/date";
import { LEAD_STAGES, LEAD_STAGE_LABELS, type LeadStage } from "@/lib/validations/lead";

/** Sotuv voronkasi: buyurtmalar bosqichlar bo'yicha va bosqichdan bosqichga o'tish foizi. */
export default async function SalesFunnelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("leads.manage");

  const { data } = await supabase.from("leads").select("stage, created_at");
  const leads = ((data ?? []) as { stage: LeadStage; created_at: string }[]).filter((l) => {
    const created = toIsoDay(l.created_at);
    if (params.from && created < params.from) return false;
    if (params.to && created > params.to) return false;
    return true;
  });

  const counts = new Map<LeadStage, number>();
  for (const l of leads) counts.set(l.stage, (counts.get(l.stage) ?? 0) + 1);

  // Voronka: har bosqichga yetib kelganlar (o'sha va undan keyingi bosqichdagilar, rad etilganlarsiz).
  const pipeline = LEAD_STAGES.filter((s) => s !== "lost");
  const reached = pipeline.map((_, i) =>
    pipeline.slice(i).reduce((sum, s) => sum + (counts.get(s) ?? 0), 0),
  );
  const top = Math.max(1, reached[0]);
  const lost = counts.get("lost") ?? 0;
  const enrolled = counts.get("enrolled") ?? 0;

  return (
    <div className="space-y-4">
      <InlineFilters
        storageKey="sales-funnel"
        configurable={false}
        fields={[
          { name: "from", label: "Sanadan", type: "date", width: "w-40" },
          { name: "to", label: "Sanagacha", type: "date", width: "w-40" },
        ]}
      />
      <ReportCards
        items={[
          { label: "Jami buyurtmalar", value: leads.length },
          { label: "O'quvchi bo'lganlar", value: enrolled, tone: "good" },
          { label: "Rad etilgan", value: lost, tone: lost > 0 ? "bad" : "default" },
          { label: "Konversiya", value: leads.length ? `${Math.round((enrolled / leads.length) * 100)}%` : "—" },
        ]}
      />
      <div className="space-y-2 rounded-xl border border-line bg-surface p-4">
        {pipeline.map((stage, i) => {
          const value = reached[i];
          const prev = i > 0 ? reached[i - 1] : null;
          return (
            <div key={stage} className="flex items-center gap-3">
              <div className="w-36 shrink-0 text-sm text-ink-muted">{LEAD_STAGE_LABELS[stage]}</div>
              <div className="h-7 flex-1 overflow-hidden rounded-lg bg-canvas">
                <div
                  className="flex h-full items-center rounded-lg bg-brand-500 px-2 text-xs font-medium text-white"
                  style={{ width: `${Math.max(4, (value / top) * 100)}%` }}
                >
                  {value}
                </div>
              </div>
              <div className="w-16 shrink-0 text-right text-xs text-ink-faint">
                {prev ? `${prev ? Math.round((value / prev) * 100) : 0}%` : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
