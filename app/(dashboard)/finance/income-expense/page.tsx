import { requirePermission } from "@/lib/auth/session";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { ReportCards, ReportTable } from "@/components/reports/ReportParts";
import { formatSom } from "@/lib/utils/currency";
import { monthStartIso, todayIso } from "@/lib/utils/date";

const METHOD_LABELS: Record<string, string> = {
  naqd: "Naqd",
  karta: "Karta",
  click: "Click",
  payme: "Payme",
};

function group<T>(rows: T[], key: (r: T) => string, amount: (r: T) => number) {
  const map = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const k = key(r);
    const cur = map.get(k) ?? { sum: 0, count: 0 };
    cur.sum += amount(r);
    cur.count += 1;
    map.set(k, cur);
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.sum - a.sum);
}

/** Kirim-chiqim hisoboti: tanlangan davrdagi tushum va xarajat (usul va kategoriya bo'yicha). */
export default async function IncomeExpensePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("finance.reports");

  const from = params.from || monthStartIso();
  const to = params.to || todayIso();

  const [paymentsRes, expensesRes] = await Promise.all([
    supabase.from("payments").select("amount, method, paid_at").gte("paid_at", from).lte("paid_at", to),
    supabase
      .from("expenses")
      .select("amount, category, method, spent_at")
      .gte("spent_at", from)
      .lte("spent_at", to),
  ]);

  const payments = (paymentsRes.data ?? []) as { amount: number; method: string | null }[];
  const expenses = (expensesRes.data ?? []) as { amount: number; category: string; method: string }[];

  const income = payments.reduce((s, p) => s + Number(p.amount), 0);
  const expense = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const incomeByMethod = group(payments, (p) => METHOD_LABELS[p.method ?? ""] ?? "Boshqa", (p) => Number(p.amount));
  const expenseByCategory = group(expenses, (e) => e.category || "Boshqa", (e) => Number(e.amount));

  return (
    <div className="space-y-4">
      <InlineFilters
        storageKey="income-expense"
        configurable={false}
        fields={[
          { name: "from", label: "Sanadan", type: "date", width: "w-40" },
          { name: "to", label: "Sanagacha", type: "date", width: "w-40" },
        ]}
      />

      <ReportCards
        items={[
          { label: "Kirim", value: formatSom(income), tone: "good" },
          { label: "Chiqim", value: formatSom(expense), tone: "bad" },
          { label: "Qoldiq", value: formatSom(income - expense), tone: income - expense < 0 ? "bad" : "default" },
          { label: "Tranzaksiyalar", value: `${payments.length + expenses.length} ta` },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">Kirim — to&apos;lov usuli bo&apos;yicha</h2>
          <ReportTable
            rows={incomeByMethod}
            rowKey={(r) => r.name}
            columns={[
              { header: "To'lov usuli", cell: (r) => <span className="text-ink">{r.name}</span> },
              { header: "Soni", cell: (r) => r.count },
              { header: "Summa", align: "right", cell: (r) => formatSom(r.sum) },
            ]}
          />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">Chiqim — kategoriya bo&apos;yicha</h2>
          <ReportTable
            rows={expenseByCategory}
            rowKey={(r) => r.name}
            columns={[
              { header: "Kategoriya", cell: (r) => <span className="text-ink">{r.name}</span> },
              { header: "Soni", cell: (r) => r.count },
              { header: "Summa", align: "right", cell: (r) => formatSom(r.sum) },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
