import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { formatTime, todayIso } from "@/lib/utils/date";
import { referencePath } from "@/lib/references";

interface EventRow {
  id: string;
  direction: string;
  event_time: string;
  device: string | null;
  student: { id: string; full_name: string } | null;
}

/** Turniket kirish-chiqish analitikasi: tanlangan kunda har bir o'quvchining kirish va chiqish vaqti. */
export default async function TurnstileLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("attendance.mark");
  const date = params.date || todayIso();

  const { data, error } = await supabase
    .from("turnstile_events")
    .select("id, direction, event_time, device, student:students(id, full_name)")
    .eq("event_date", date)
    .order("event_time");

  const q = params.q?.trim().toLowerCase();
  const events = ((data ?? []) as unknown as EventRow[]).filter(
    (e) => !q || (e.student?.full_name ?? "").toLowerCase().includes(q),
  );

  const byStudent = new Map<string, { id: string; name: string; entries: string[]; exits: string[] }>();
  for (const e of events) {
    const key = e.student?.id ?? "unknown";
    const row = byStudent.get(key) ?? { id: key, name: e.student?.full_name ?? "Noma'lum", entries: [], exits: [] };
    (e.direction === "Kirish" ? row.entries : row.exits).push(e.event_time);
    byStudent.set(key, row);
  }
  const rows = [...byStudent.values()].sort((a, b) => a.name.localeCompare(b.name));
  const inside = rows.filter((r) => r.entries.length > r.exits.length).length;

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Turniket jadvali bazada topilmadi — 0051_turnstile_support.sql migratsiyasini Supabase SQL Editor&apos;da
          ishga tushiring (yangi-migratsiyalar.sql ichida).
        </p>
      )}
      <InlineFilters
        storageKey="turnstile-log"
        configurable={false}
        fields={[
          { name: "date", label: "Sana", type: "date", width: "w-44" },
          { name: "q", label: "O'quvchi", type: "text", width: "w-48" },
        ]}
      />
      <ReportCards
        items={[
          { label: "O'tgan o'quvchilar", value: rows.length },
          { label: "Hozir ichkarida", value: inside },
          { label: "Jami voqealar", value: events.length },
        ]}
      />
      <p className="text-xs text-ink-muted">
        Voqealarni{" "}
        <Link href={referencePath("turnstile-events")} className="text-brand-600 hover:underline">
          qo&apos;lda kiritish
        </Link>{" "}
        mumkin.
      </p>
      <ReportTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { header: "O'quvchi", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
          { header: "Birinchi kirish", cell: (r) => (r.entries[0] ? formatTime(r.entries[0]) : "—") },
          { header: "Oxirgi chiqish", cell: (r) => (r.exits.length ? formatTime(r.exits[r.exits.length - 1]) : "—") },
          { header: "Kirish / chiqish soni", cell: (r) => `${r.entries.length} / ${r.exits.length}` },
        ]}
      />
    </div>
  );
}
