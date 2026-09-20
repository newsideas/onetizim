import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { formatDate, todayIso } from "@/lib/utils/date";
import { referencePath } from "@/lib/references";

interface EventRow {
  student_id: string | null;
  direction: string;
  event_date: string;
}

/** Bugundan n kun oldingi sana (YYYY-MM-DD). */
function daysAgo(n: number): string {
  const [y, m, d] = todayIso().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/** Turniket analitikasi: kunlar kesimida kirishlar soni va turniketdan o'tgan noyob o'quvchilar. */
export default async function TurnstileAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("attendance.mark");
  const from = params.from || daysAgo(30);
  const to = params.to || todayIso();

  const { data, error } = await supabase
    .from("turnstile_events")
    .select("student_id, direction, event_date")
    .gte("event_date", from)
    .lte("event_date", to);

  const events = (data ?? []) as EventRow[];
  const byDay = new Map<string, { entries: number; exits: number; students: Set<string> }>();
  for (const e of events) {
    const day = byDay.get(e.event_date) ?? { entries: 0, exits: 0, students: new Set<string>() };
    if (e.direction === "Kirish") day.entries += 1;
    else day.exits += 1;
    if (e.student_id) day.students.add(e.student_id);
    byDay.set(e.event_date, day);
  }
  const rows = [...byDay.entries()]
    .map(([date, v]) => ({ date, entries: v.entries, exits: v.exits, students: v.students.size }))
    .sort((a, b) => b.date.localeCompare(a.date));
  const uniqueStudents = new Set(events.flatMap((e) => (e.student_id ? [e.student_id] : []))).size;

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Turniket jadvali bazada topilmadi — 0051_turnstile_support.sql migratsiyasini Supabase SQL Editor&apos;da
          ishga tushiring (yangi-migratsiyalar.sql ichida).
        </p>
      )}
      <InlineFilters
        storageKey="turnstile"
        configurable={false}
        fields={[
          { name: "from", label: "Sanadan", type: "date", width: "w-44" },
          { name: "to", label: "Sanagacha", type: "date", width: "w-44" },
        ]}
      />
      <ReportCards
        items={[
          { label: "Kirishlar", value: events.filter((e) => e.direction === "Kirish").length },
          { label: "Chiqishlar", value: events.filter((e) => e.direction !== "Kirish").length },
          { label: "Noyob o'quvchilar", value: uniqueStudents },
          { label: "Kunlar soni", value: rows.length },
        ]}
      />
      <p className="text-xs text-ink-muted">
        Voqealar turniket qurilmasidan keladi yoki{" "}
        <Link href={referencePath("turnstile-events")} className="text-brand-600 hover:underline">
          qo&apos;lda kiritiladi
        </Link>
        .
      </p>
      <ReportTable
        rows={rows}
        rowKey={(r) => r.date}
        columns={[
          { header: "Sana", cell: (r) => <span className="font-medium text-ink">{formatDate(r.date)}</span> },
          { header: "Kirishlar", cell: (r) => r.entries },
          { header: "Chiqishlar", cell: (r) => r.exits },
          { header: "O'quvchilar", cell: (r) => r.students },
        ]}
      />
    </div>
  );
}
