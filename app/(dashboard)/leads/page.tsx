import { CalendarClock, Percent, Target, UserPlus } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getOrgMembers } from "@/lib/staff";
import { monthStartIso } from "@/lib/utils/date";
import { LEAD_SOURCES } from "@/lib/validations/lead";
import { ListPageShell } from "@/components/ui/ListPage";
import { FilterBar } from "@/components/ui/FilterBar";
import { StatCard } from "@/components/ui/StatCard";
import { LeadsProvider, NewLeadButton, type LeadRow } from "@/components/leads/LeadsProvider";
import { LeadsBoard } from "@/components/leads/LeadsBoard";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, org } = await requirePermission("leads.manage");

  let query = supabase
    .from("leads")
    .select(
      "id, full_name, phone, source, interest, stage, assigned_to, trial_date, note, student_id, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  const q = params.q?.replace(/[,()%_\\*]/g, " ").trim();
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  if (params.assigned) query = query.eq("assigned_to", params.assigned);
  if (params.source) query = query.eq("source", params.source);

  const [leadsResult, members, { data: courses }] = await Promise.all([
    query,
    getOrgMembers(supabase, org.id),
    supabase.from("courses").select("name").order("name"),
  ]);

  const leads = (leadsResult.data ?? []) as LeadRow[];
  const managers = members
    .filter((m) => m.role !== "teacher")
    .map((m) => ({ id: m.userId, name: m.name }));

  const monthStart = monthStartIso();
  const newThisMonth = leads.filter((l) => l.created_at.slice(0, 10) >= monthStart).length;
  const inTrial = leads.filter((l) => l.stage === "trial").length;
  const won = leads.filter((l) => l.stage === "contract").length;
  const closed = won + leads.filter((l) => l.stage === "lost").length;

  return (
    <LeadsProvider
      options={{
        members: managers,
        sources: LEAD_SOURCES,
        interests: (courses ?? []).map((c) => c.name as string),
      }}
    >
      <ListPageShell
        title="Lidlar"
        subtitle="Savdo voronkasi"
        actions={<NewLeadButton />}
        notice={
          leadsResult.error
            ? "Lidlar jadvali bazada topilmadi — 0023_leads.sql migratsiyasini Supabase SQL Editor'da ishga tushiring."
            : undefined
        }
        filters={
          <FilterBar
            action="/leads"
            values={params}
            fields={[
              { name: "q", label: "Qidiruv", placeholder: "Ism yoki telefon" },
              {
                name: "assigned",
                label: "Mas'ul",
                options: managers.map((m) => ({ value: m.id, label: m.name })),
              },
              {
                name: "source",
                label: "Manba",
                options: LEAD_SOURCES.map((s) => ({ value: s, label: s })),
              },
            ]}
          />
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Jami lidlar" value={leads.length} icon={Target} accent="brand" />
          <StatCard label="Bu oy yangi" value={newThisMonth} icon={UserPlus} accent="blue" />
          <StatCard label="Sinov darsida" value={inTrial} icon={CalendarClock} accent="amber" />
          <StatCard
            label="Konversiya"
            value={closed > 0 ? `${Math.round((won / closed) * 100)}%` : "—"}
            icon={Percent}
            accent="green"
            hint="Yopilgan lidlar ichida shartnoma"
          />
        </div>

        <LeadsBoard leads={leads} />
      </ListPageShell>
    </LeadsProvider>
  );
}
