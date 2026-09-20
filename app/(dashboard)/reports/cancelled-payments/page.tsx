import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { formatDate, toIsoDay } from "@/lib/utils/date";
import { formatSom } from "@/lib/utils/currency";
import { METHOD_LABELS } from "@/lib/validations/payment";
import type { PaymentMethod } from "@/types/database";

interface Row {
  id: string;
  student_name: string | null;
  amount: number;
  method: PaymentMethod | null;
  paid_at: string | null;
  reason: string | null;
  cancelled_at: string;
}

/** Bekor qilingan to'lovlar: to'lovlar jurnalidan "Bekor qilish" bilan ko'chirilgan yozuvlar. */
export default async function CancelledPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("finance.reports");

  const { data, error } = await supabase
    .from("cancelled_payments")
    .select("id, student_name, amount, method, paid_at, reason, cancelled_at")
    .order("cancelled_at", { ascending: false });

  const q = params.q?.trim().toLowerCase();
  const rows = ((data ?? []) as Row[]).filter((r) => {
    const day = toIsoDay(r.cancelled_at);
    if (params.from && day < params.from) return false;
    if (params.to && day > params.to) return false;
    if (q && !(r.student_name ?? "").toLowerCase().includes(q)) return false;
    return true;
  });
  const total = rows.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Bekor qilingan to&apos;lovlar jadvali bazada topilmadi — 0050_cancelled_payments.sql
          migratsiyasini Supabase SQL Editor&apos;da ishga tushiring (yangi-migratsiyalar.sql ichida).
        </p>
      )}
      <InlineFilters
        storageKey="cancelled-payments"
        configurable={false}
        fields={[
          { name: "q", label: "O'quvchi", type: "text", width: "w-48" },
          { name: "from", label: "Bekor qilingan sanadan", type: "date", width: "w-44" },
          { name: "to", label: "Bekor qilingan sanagacha", type: "date", width: "w-44" },
        ]}
      />
      <ReportCards
        items={[
          { label: "Bekor qilingan to'lovlar", value: rows.length },
          { label: "Jami summa", value: formatSom(total) },
        ]}
      />
      <ReportTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          { header: "O'quvchi", cell: (r) => <span className="font-medium text-ink">{r.student_name || "—"}</span> },
          { header: "Summa", cell: (r) => formatSom(Number(r.amount)) },
          { header: "Usul", cell: (r) => (r.method ? (METHOD_LABELS[r.method] ?? r.method) : "—") },
          { header: "To'lov sanasi", cell: (r) => (r.paid_at ? formatDate(r.paid_at) : "—") },
          { header: "Bekor qilingan", cell: (r) => formatDate(r.cancelled_at) },
          { header: "Sabab", cell: (r) => r.reason || "—" },
        ]}
      />
    </div>
  );
}
