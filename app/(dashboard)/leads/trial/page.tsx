import { requirePermission } from "@/lib/auth/session";
import { getOrgMembers } from "@/lib/staff";
import { LEAD_SOURCES } from "@/lib/validations/lead";
import { InlineFilters, TablePager, type InlineField } from "@/components/ui/ListToolbar";
import { readPaging } from "@/lib/paging";
import { LeadsProvider, NewLeadButton, type LeadRow } from "@/components/leads/LeadsProvider";
import { LeadsList } from "@/components/leads/LeadsList";

/** «Birinchi darsga yozilganlar»: sinov/birinchi dars sanasi belgilangan arizalar. */
export default async function TrialLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, org } = await requirePermission("leads.manage");

  let query = supabase
    .from("leads")
    .select(
      "*",
    )
    .not("trial_date", "is", null)
    .order("trial_date", { ascending: false });

  const q = params.q?.replace(/[,()%_\\*]/g, " ").trim();
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  if (params.assigned) query = query.eq("assigned_to", params.assigned);
  if (params.interest) query = query.eq("interest", params.interest);
  if (params.from) query = query.gte("trial_date", params.from);
  if (params.to) query = query.lte("trial_date", params.to);

  const [leadsResult, members, { data: classes }] = await Promise.all([
    query,
    getOrgMembers(supabase, org.id),
    supabase.from("groups").select("name").order("name"),
  ]);

  const leads = (leadsResult.data ?? []) as LeadRow[];
  const managers = members
    .filter((m) => m.role !== "teacher")
    .map((m) => ({ id: m.userId, name: m.name }));
  const interests = (classes ?? []).map((c) => c.name as string);

  const { page, size } = readPaging(params);
  const current = Math.min(page, Math.max(1, Math.ceil(leads.length / size)));
  const offset = (current - 1) * size;
  const visible = leads.slice(offset, offset + size);

  const fields: InlineField[] = [
    { name: "q", label: "Qidiruv", type: "text" },
    { name: "from", label: "Dars sanasidan", type: "date", width: "w-40" },
    { name: "to", label: "Dars sanasigacha", type: "date", width: "w-40" },
    {
      name: "interest",
      label: "Kurs",
      type: "select",
      options: interests.map((i) => ({ value: i, label: i })),
    },
    {
      name: "assigned",
      label: "Moderator",
      type: "select",
      options: managers.map((m) => ({ value: m.id, label: m.name })),
    },
  ];

  return (
    <LeadsProvider options={{ members: managers, sources: LEAD_SOURCES, interests }}>
      <div className="space-y-3">
        <InlineFilters
          storageKey="leads-trial"
          configurable={false}
          actions={<NewLeadButton />}
          fields={fields}
        />

        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex justify-end px-4 py-3">
            <span className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted">
              Umumiy soni <b className="ml-1 text-ink">{leads.length}</b>
            </span>
          </div>
          <LeadsList leads={visible} mode="trial" offset={offset} />
          <TablePager total={leads.length} page={current} size={size} />
        </div>
      </div>
    </LeadsProvider>
  );
}
