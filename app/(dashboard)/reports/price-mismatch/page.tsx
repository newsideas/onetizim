import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { formatSom } from "@/lib/utils/currency";
import { formatDate, monthStartIso, todayIso } from "@/lib/utils/date";

interface Row {
  id: string;
  amount: number;
  paid_at: string;
  student: { id: string; full_name: string; group: { name: string; monthly_price: number } | null } | null;
}

/** Kurs narxidan farqli to'lovlar: to'lov summasi guruhning oylik narxiga teng bo'lmaganlar. */
export default async function PriceMismatchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("finance.reports");

  const from = params.from || monthStartIso();
  const to = params.to || todayIso();

  const { data } = await supabase
    .from("payments")
    .select("id, amount, paid_at, student:students(id, full_name, group:groups(name, monthly_price))")
    .gte("paid_at", from)
    .lte("paid_at", to)
    .order("paid_at", { ascending: false });

  const rows = ((data ?? []) as unknown as Row[])
    .filter((p) => {
      const price = Number(p.student?.group?.monthly_price ?? 0);
      return price > 0 && Number(p.amount) !== price;
    })
    .map((p) => {
      const price = Number(p.student?.group?.monthly_price ?? 0);
      return { ...p, price, diff: Number(p.amount) - price };
    });

  return (
    <div className="space-y-4">
      <InlineFilters
        storageKey="price-mismatch"
        configurable={false}
        fields={[
          { name: "from", label: "Sanadan", type: "date", width: "w-40" },
          { name: "to", label: "Sanagacha", type: "date", width: "w-40" },
        ]}
      />
      <ReportCards
        items={[
          { label: "Farqli to'lovlar", value: rows.length },
          { label: "Kam to'langan", value: rows.filter((r) => r.diff < 0).length, tone: "bad" },
          { label: "Ko'p to'langan", value: rows.filter((r) => r.diff > 0).length, tone: "good" },
        ]}
      />
      <ReportTable
        rows={rows}
        rowKey={(r) => r.id}
        columns={[
          {
            header: "O'quvchi",
            cell: (r) =>
              r.student ? (
                <Link href={`/education/students/${r.student.id}`} className="font-medium text-ink hover:text-brand-600">
                  {r.student.full_name}
                </Link>
              ) : (
                "—"
              ),
          },
          { header: "Turi", cell: () => "Kirim" },
          { header: "Guruh", cell: (r) => r.student?.group?.name ?? "—" },
          { header: "O'quvchi narxi", align: "right", cell: (r) => formatSom(Number(r.amount)) },
          { header: "Kurs narxi", align: "right", cell: (r) => formatSom(r.price) },
          { header: "Yaratildi", cell: (r) => formatDate(r.paid_at) },
        ]}
      />
    </div>
  );
}
