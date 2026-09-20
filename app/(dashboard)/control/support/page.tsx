import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { formatDate, todayIso } from "@/lib/utils/date";
import { referencePath } from "@/lib/references";

interface Ticket {
  id: string;
  author_name: string;
  subject: string;
  status: string;
  created_on: string;
  closed_on: string | null;
}

const DAY_MS = 86_400_000;

function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

/** Support analitikasi: murojaatlar holati bo'yicha va o'rtacha yopilish muddati. */
export default async function SupportAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("attendance.mark");

  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, author_name, subject, status, created_on, closed_on")
    .order("created_on", { ascending: false });

  const tickets = ((data ?? []) as Ticket[]).filter((t) => {
    if (params.from && t.created_on < params.from) return false;
    if (params.to && t.created_on > params.to) return false;
    return true;
  });

  const closed = tickets.filter((t) => t.status === "Yopilgan");
  const durations = closed.filter((t) => t.closed_on).map((t) => dayDiff(t.created_on, t.closed_on as string));
  const avg = durations.length ? (durations.reduce((s, n) => s + n, 0) / durations.length).toFixed(1) : "—";
  const open = tickets.filter((t) => t.status !== "Yopilgan");
  const today = todayIso();

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Support jadvali bazada topilmadi — 0051_turnstile_support.sql migratsiyasini Supabase SQL Editor&apos;da
          ishga tushiring (yangi-migratsiyalar.sql ichida).
        </p>
      )}
      <InlineFilters
        storageKey="support"
        configurable={false}
        fields={[
          { name: "from", label: "Sanadan", type: "date", width: "w-44" },
          { name: "to", label: "Sanagacha", type: "date", width: "w-44" },
        ]}
      />
      <ReportCards
        items={[
          { label: "Jami murojaatlar", value: tickets.length },
          { label: "Ochiq", value: open.length, tone: open.length > 0 ? "bad" : "good" },
          { label: "Yopilgan", value: closed.length, tone: "good" },
          { label: "O'rtacha yopilish (kun)", value: avg },
        ]}
      />
      <p className="text-xs text-ink-muted">
        Murojaatlarni{" "}
        <Link href={referencePath("support-tickets")} className="text-brand-600 hover:underline">
          shu sahifada qo&apos;shing va yopilgan deb belgilang
        </Link>
        .
      </p>
      <ReportTable
        rows={open}
        rowKey={(r) => r.id}
        columns={[
          { header: "Mavzu", cell: (r) => <span className="font-medium text-ink">{r.subject}</span> },
          { header: "Murojaat egasi", cell: (r) => r.author_name },
          { header: "Holati", cell: (r) => r.status },
          { header: "Kelgan sana", cell: (r) => formatDate(r.created_on) },
          { header: "Kutilmoqda (kun)", cell: (r) => dayDiff(r.created_on, today) },
        ]}
      />
    </div>
  );
}
