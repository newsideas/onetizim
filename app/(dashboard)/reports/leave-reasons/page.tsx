import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { toIsoDay } from "@/lib/utils/date";

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
          { label: "Umumiy ketganlar", value: rows.length },
          { label: "Buyurtmadan ketganlar", value: 0 },
          { label: "To'lov qilmasdan ketganlar", value: 0 },
          { label: "To'lov qilib ketganlar", value: rows.length },
        ]}
      />
      <div className="rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-muted">
        Umumiy ketgan o&apos;quvchilar: <b className="text-ink">{rows.length}</b>
      </div>
      <h2 className="text-sm font-semibold text-ink-muted">Sababi</h2>

      <ReportTable
        rows={summary}
        rowKey={(r) => r.reason}
        columns={[
          { header: "Sabab nomi", cell: (r) => <span className="font-medium text-ink">{r.reason}</span> },
          { header: "Ketgan o'quvchi soni", cell: (r) => r.count },
        ]}
      />
    </div>
  );
}
