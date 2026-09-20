import Link from "next/link";
import { Columns3, List } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getOrgMembers } from "@/lib/staff";
import { toIsoDay } from "@/lib/utils/date";
import { LEAD_SOURCES, LEAD_STAGES, LEAD_STAGE_LABELS, isLeadStage } from "@/lib/validations/lead";
import { InlineFilters, TablePager, type InlineField } from "@/components/ui/ListToolbar";
import { readPaging } from "@/lib/paging";
import { LeadsProvider, NewLeadButton, type LeadRow } from "@/components/leads/LeadsProvider";
import { LeadsBoard } from "@/components/leads/LeadsBoard";
import { LeadsList } from "@/components/leads/LeadsList";

/** Joriy filtrlarni saqlagan holda bitta parametrni almashtiradigan havola. */
function hrefWith(params: Record<string, string | undefined>, change: Record<string, string | null>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) next.set(key, value);
  for (const [key, value] of Object.entries(change)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  next.delete("page");
  const query = next.toString();
  return query ? `/leads?${query}` : "/leads";
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, org } = await requirePermission("leads.manage");
  const board = params.view === "board";
  const stage = params.stage && isLeadStage(params.stage) ? params.stage : null;

  let query = supabase
    .from("leads")
    .select(
      "*",
    )
    .order("created_at", { ascending: false });

  const q = params.q?.replace(/[,()%_\\*]/g, " ").trim();
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  if (params.assigned) query = query.eq("assigned_to", params.assigned);
  if (params.source) query = query.eq("source", params.source);
  if (params.interest) query = query.eq("interest", params.interest);

  const [leadsResult, members, { data: classes }] = await Promise.all([
    query,
    getOrgMembers(supabase, org.id),
    supabase.from("groups").select("name").order("name"),
  ]);

  const managers = members
    .filter((m) => m.role !== "teacher")
    .map((m) => ({ id: m.userId, name: m.name }));
  const interests = (classes ?? []).map((c) => c.name as string);

  // Sana oralig'i (yaratilgan sana) — bosqichdan tashqari filtrlar; chip sonlari shularga tayanadi.
  const inRange = ((leadsResult.data ?? []) as LeadRow[]).filter((l) => {
    const created = toIsoDay(l.created_at);
    if (params.from && created < params.from) return false;
    if (params.to && created > params.to) return false;
    return true;
  });
  const leads = stage ? inRange.filter((l) => l.stage === stage) : inRange;

  const { page, size } = readPaging(params);
  const current = Math.min(page, Math.max(1, Math.ceil(leads.length / size)));
  const offset = (current - 1) * size;
  const visible = leads.slice(offset, offset + size);

  const counts = new Map<string, number>();
  for (const l of inRange) counts.set(l.stage, (counts.get(l.stage) ?? 0) + 1);

  const fields: InlineField[] = [
    { name: "q", label: "Qidiruv", type: "text" },
    { name: "from", label: "Sanadan", type: "date", width: "w-40" },
    { name: "to", label: "Sanagacha", type: "date", width: "w-40" },
    {
      name: "assigned",
      label: "Moderator",
      type: "select",
      options: managers.map((m) => ({ value: m.id, label: m.name })),
    },
    {
      name: "interest",
      label: "Kurs",
      type: "select",
      options: interests.map((i) => ({ value: i, label: i })),
    },
    {
      name: "source",
      label: "Manba",
      type: "select",
      options: LEAD_SOURCES.map((s) => ({ value: s, label: s })),
    },
  ];

  const chipBase =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors";

  return (
    <LeadsProvider options={{ members: managers, sources: LEAD_SOURCES, interests }}>
      <div className="space-y-3">
        {leadsResult.error && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            Arizalar jadvali yoki yangi ustunlar bazada topilmadi — 0023_leads.sql va
            0031_admission.sql migratsiyalarini Supabase SQL Editor&apos;da ishga tushiring.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-canvas p-1">
              <Link
                href={hrefWith(params, { view: null })}
                aria-label="Ro'yxat ko'rinishi"
                title="Ro'yxat ko'rinishi"
                className={`flex h-8 w-9 items-center justify-center rounded-md transition-colors ${
                  !board ? "bg-brand-600 text-white" : "text-ink-muted hover:bg-line"
                }`}
              >
                <List size={16} />
              </Link>
              <Link
                href={hrefWith(params, { view: "board" })}
                aria-label="Doska ko'rinishi"
                title="Doska ko'rinishi"
                className={`flex h-8 w-9 items-center justify-center rounded-md transition-colors ${
                  board ? "bg-brand-600 text-white" : "text-ink-muted hover:bg-line"
                }`}
              >
                <Columns3 size={16} />
              </Link>
            </div>

            <Link
              href={hrefWith(params, { stage: null })}
              className={`${chipBase} ${
                !stage
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-line bg-surface text-ink-muted hover:bg-canvas"
              }`}
            >
              Barchasi: {inRange.length}
            </Link>
            {LEAD_STAGES.map((s) => (
              <Link
                key={s}
                href={hrefWith(params, { stage: stage === s ? null : s })}
                className={`${chipBase} ${
                  stage === s
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-line bg-surface text-ink-muted hover:bg-canvas"
                }`}
              >
                {LEAD_STAGE_LABELS[s]}: {counts.get(s) ?? 0}
              </Link>
            ))}
          </div>

          <NewLeadButton />
        </div>

        <InlineFilters storageKey="leads" fields={fields} />

        {board ? (
          <LeadsBoard leads={leads} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="flex justify-end px-4 py-3">
              <span className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink-muted">
                Umumiy soni <b className="ml-1 text-ink">{leads.length}</b>
              </span>
            </div>
            <LeadsList leads={visible} mode="all" offset={offset} />
            <TablePager total={leads.length} page={current} size={size} />
          </div>
        )}
      </div>
    </LeadsProvider>
  );
}
