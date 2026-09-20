import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { formatDate, toIsoDay } from "@/lib/utils/date";

interface Row {
  id: string;
  full_name: string;
  archive_reason: string | null;
  archived_at: string | null;
  created_at: string;
}

const NO_REASON = "Sabab ko'rsatilmagan";

/** Ketish sabablari: arxivlangan o'quvchilar sabab bo'yicha (arxivlanganda kiritiladi). */
export default async function LeaveReasonsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("finance.reports");

  const { data, error } = await supabase
    .from("students")
    .select("id, full_name, archive_reason, archived_at, created_at")
    .eq("status", "archived")
    .order("archived_at", { ascending: false });

  const rows = ((data ?? []) as Row[]).filter((r) => {
    const day = toIsoDay(r.archived_at ?? r.created_at);
    if (params.from && day < params.from) return false;
    if (params.to && day > params.to) return false;
    return true;
  });

  const byReason = new Map<string, Row[]>();
  for (const r of rows) {
    const key = r.archive_reason?.trim() || NO_REASON;
    byReason.set(key, [...(byReason.get(key) ?? []), r]);
  }
  const summary = [...byReason.entries()]
    .map(([reason, list]) => ({
      reason,
      count: list.length,
      percent: rows.length ? Math.round((list.length / rows.length) * 100) : 0,
      list,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Ketish sababi ustuni bazada topilmadi — 0049_student_archive_reason.sql migratsiyasini Supabase SQL
          Editor&apos;da ishga tushiring (yangi-migratsiyalar.sql ichida).
        </p>
      )}
      <InlineFilters
        storageKey="leave-reasons"
        configurable={false}
        fields={[
          { name: "from", label: "Arxivlangan sanadan", type: "date", width: "w-44" },
          { name: "to", label: "Arxivlangan sanagacha", type: "date", width: "w-44" },
        ]}
      />
      <ReportCards
        items={[
          { label: "Arxivlanganlar", value: rows.length },
          { label: "Turli sabablar", value: summary.filter((s) => s.reason !== NO_REASON).length },
          {
            label: "Eng ko'p sabab",
            value: summary[0] ? `${summary[0].reason} (${summary[0].count})` : "—",
          },
        ]}
      />

      <ReportTable
        rows={summary}
        rowKey={(r) => r.reason}
        columns={[
          { header: "Ketish sababi", cell: (r) => <span className="font-medium text-ink">{r.reason}</span> },
          { header: "O'quvchilar soni", cell: (r) => r.count },
          {
            header: "Ulushi",
            cell: (r) => (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${r.percent}%` }} />
                </div>
                <span className="text-xs">{r.percent}%</span>
              </div>
            ),
          },
          {
            header: "O'quvchilar",
            cell: (r) => (
              <span className="text-xs">
                {r.list.slice(0, 4).map((s, i) => (
                  <span key={s.id}>
                    {i > 0 && ", "}
                    <Link href={`/education/students/${s.id}`} className="text-brand-600 hover:underline">
                      {s.full_name}
                    </Link>
                    {s.archived_at ? ` (${formatDate(s.archived_at)})` : ""}
                  </span>
                ))}
                {r.list.length > 4 ? ` va yana ${r.list.length - 4} ta` : ""}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
