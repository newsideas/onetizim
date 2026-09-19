import { PhoneCall, Percent, Target, UserPlus } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getOrgMembers } from "@/lib/staff";
import { monthStartIso, todayIso } from "@/lib/utils/date";
import { CLOSED_LEAD_STAGES, LEAD_SOURCES } from "@/lib/validations/lead";
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
      "id, full_name, parent_name, phone, source, interest, stage, assigned_to, trial_date, interest_level, next_contact_on, note, student_id, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  const q = params.q?.replace(/[,()%_\\*]/g, " ").trim();
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  if (params.assigned) query = query.eq("assigned_to", params.assigned);
  if (params.source) query = query.eq("source", params.source);

  const [leadsResult, members, { data: classes }] = await Promise.all([
    query,
    getOrgMembers(supabase, org.id),
    supabase.from("groups").select("name").order("name"),
  ]);

  const leads = (leadsResult.data ?? []) as LeadRow[];
  const managers = members
    .filter((m) => m.role !== "teacher")
    .map((m) => ({ id: m.userId, name: m.name }));

  const monthStart = monthStartIso();
  const newThisMonth = leads.filter((l) => l.created_at.slice(0, 10) >= monthStart).length;
  const today = todayIso();
  const callsDue = leads.filter(
    (l) => l.next_contact_on && l.next_contact_on <= today && !CLOSED_LEAD_STAGES.includes(l.stage),
  ).length;
  const won = leads.filter((l) => l.stage === "enrolled").length;
  const closed = won + leads.filter((l) => l.stage === "lost").length;

  return (
    <LeadsProvider
      options={{
        members: managers,
        sources: LEAD_SOURCES,
        interests: (classes ?? []).map((c) => c.name as string),
      }}
    >
      <ListPageShell
        title="Qabul"
        subtitle="Yangi o'quvchilarni qabul qilish voronkasi"
        actions={<NewLeadButton />}
        notice={
          leadsResult.error
            ? "Arizalar jadvali yoki yangi ustunlar bazada topilmadi — 0023_leads.sql va 0031_admission.sql migratsiyalarini Supabase SQL Editor'da ishga tushiring."
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
          <StatCard label="Jami arizalar" value={leads.length} icon={Target} accent="brand" />
          <StatCard label="Bu oy yangi" value={newThisMonth} icon={UserPlus} accent="blue" />
          <StatCard label="Bugun bog'lanish kerak" value={callsDue} icon={PhoneCall} accent="amber" />
          <StatCard
            label="Konversiya"
            value={closed > 0 ? `${Math.round((won / closed) * 100)}%` : "—"}
            icon={Percent}
            accent="green"
            hint="Yopilgan arizalar ichida o'quvchi bo'lganlar"
          />
        </div>

        <LeadsBoard leads={leads} />
      </ListPageShell>
    </LeadsProvider>
  );
}
