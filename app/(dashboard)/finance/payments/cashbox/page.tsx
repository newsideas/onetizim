import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";
import { InlineFilters } from "@/components/ui/ListToolbar";
import { PaymentsTabs } from "@/components/finance/PaymentsTabs";
import { ExpensesList, type ExpenseRow } from "@/components/finance/ExpensesList";
import { ReportTable } from "@/components/reports/ReportParts";
import { CashboxCard, NewCashboxButton, type CashboxView } from "@/components/cashbox/CashboxPanel";
import { formatDate, toIsoDay } from "@/lib/utils/date";
import { formatSom } from "@/lib/utils/currency";

interface CashboxRow {
  id: string;
  name: string;
  moderator_id: string | null;
  accepts_online: boolean;
  is_archived: boolean;
}

interface Transaction {
  key: string;
  date: string;
  who: string;
  note: string | null;
  name: string;
  /** Kirim musbat, chiqim manfiy. */
  amount: number;
  type: "Kirim" | "Chiqim" | "Ko'chirish";
}

type Related<T> = T | T[] | null;

function one<T>(value: Related<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Kassa: chapda kassa kartalari (qoldiq, moderator, Kirim / Chiqim / Ko'chirish), o'ngda tanlangan
 * kassaning tranzaksiyalari (to'lovlar, xarajatlar, oyliklar, ko'chirishlar).
 */
export default async function CashboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { supabase } = await requirePermission("payments.manage");

  const [cashboxesRes, balancesRes, teachersRes, studentsRes, expensesRes] = await Promise.all([
    supabase
      .from("cashboxes")
      .select("id, name, moderator_id, accepts_online, is_archived")
      .order("created_at"),
    supabase.rpc("cashbox_balances"),
    supabase.from("teachers").select("id, full_name").order("full_name"),
    supabase.from("students").select("id, full_name").order("full_name"),
    supabase
      .from("expenses")
      .select("id, amount, category, method, spent_at, note")
      .order("spent_at", { ascending: false })
      .limit(100),
  ]);

  const teachers = (teachersRes.data ?? []) as { id: string; full_name: string }[];
  const students = (studentsRes.data ?? []) as { id: string; full_name: string }[];
  const expenses = (expensesRes.data ?? []) as ExpenseRow[];

  if (cashboxesRes.error) {
    return (
      <ListPageShell
        title="Kassa"
        subtitle="Kirim-chiqim va kassalar bo'yicha qoldiq"
        tabs={<PaymentsTabs current="cashbox" />}
        notice="Kassa jadvallari bazada topilmadi — 0057_cashboxes.sql migratsiyasini Supabase SQL Editor'da ishga tushiring (yangi-migratsiyalar.sql ichida)."
      >
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-ink-muted">Xarajatlar</h2>
          <ExpensesList expenses={expenses} />
        </div>
      </ListPageShell>
    );
  }

  const teacherName = new Map(teachers.map((t) => [t.id, t.full_name]));
  const balanceById = new Map(
    ((balancesRes.data ?? []) as { cashbox_id: string; income: number; outcome: number }[]).map((b) => [
      b.cashbox_id,
      Number(b.income) - Number(b.outcome),
    ]),
  );

  const archivedView = params.holat === "arxiv";
  const all: CashboxView[] = ((cashboxesRes.data ?? []) as CashboxRow[]).map((c) => ({
    id: c.id,
    name: c.name,
    moderatorId: c.moderator_id,
    moderatorName: c.moderator_id ? (teacherName.get(c.moderator_id) ?? null) : null,
    acceptsOnline: c.accepts_online,
    isArchived: c.is_archived,
    balance: balanceById.get(c.id) ?? 0,
  }));
  const visible = all.filter((c) => c.isArchived === archivedView);
  const selected = all.find((c) => c.id === params.kassa) ?? visible[0] ?? null;
  const moderators = teachers;

  // Tanlangan kassaning tranzaksiyalari.
  let transactions: Transaction[] = [];
  if (selected) {
    const id = selected.id;
    const [paymentsRes, kassaExpensesRes, payoutsRes, transfersRes] = await Promise.all([
      supabase
        .from("payments")
        .select("id, amount, paid_at, note, student:students(full_name)")
        .eq("cashbox_id", id)
        .order("paid_at", { ascending: false })
        .limit(200),
      supabase
        .from("expenses")
        .select("id, amount, category, spent_at, note")
        .eq("cashbox_id", id)
        .order("spent_at", { ascending: false })
        .limit(200),
      supabase
        .from("salary_payouts")
        .select("id, amount, paid_at, note, employee:teachers(full_name)")
        .eq("cashbox_id", id)
        .order("paid_at", { ascending: false })
        .limit(200),
      supabase
        .from("cash_transfers")
        .select("id, from_cashbox_id, to_cashbox_id, amount, transfer_date, note")
        .or(`from_cashbox_id.eq.${id},to_cashbox_id.eq.${id}`)
        .order("transfer_date", { ascending: false })
        .limit(200),
    ]);

    const cashboxName = new Map(all.map((c) => [c.id, c.name]));

    for (const p of (paymentsRes.data ?? []) as unknown as {
      id: string;
      amount: number;
      paid_at: string;
      note: string | null;
      student: Related<{ full_name: string }>;
    }[]) {
      transactions.push({
        key: `p-${p.id}`,
        date: p.paid_at,
        who: one(p.student)?.full_name ?? "—",
        note: p.note,
        name: "O'quvchi to'ladi",
        amount: Number(p.amount),
        type: "Kirim",
      });
    }
    for (const e of (kassaExpensesRes.data ?? []) as {
      id: string;
      amount: number;
      category: string;
      spent_at: string;
      note: string | null;
    }[]) {
      transactions.push({
        key: `e-${e.id}`,
        date: e.spent_at,
        who: "—",
        note: e.note,
        name: e.category,
        amount: -Number(e.amount),
        type: "Chiqim",
      });
    }
    for (const s of (payoutsRes.data ?? []) as unknown as {
      id: string;
      amount: number;
      paid_at: string;
      note: string | null;
      employee: Related<{ full_name: string }>;
    }[]) {
      transactions.push({
        key: `s-${s.id}`,
        date: s.paid_at,
        who: one(s.employee)?.full_name ?? "—",
        note: s.note,
        name: "Oylik to'lovi",
        amount: -Number(s.amount),
        type: "Chiqim",
      });
    }
    for (const t of (transfersRes.data ?? []) as {
      id: string;
      from_cashbox_id: string;
      to_cashbox_id: string;
      amount: number;
      transfer_date: string;
      note: string | null;
    }[]) {
      const outgoing = t.from_cashbox_id === id;
      transactions.push({
        key: `t-${t.id}`,
        date: t.transfer_date,
        who: "—",
        note: t.note,
        name: outgoing
          ? `Ko'chirish → ${cashboxName.get(t.to_cashbox_id) ?? "kassa"}`
          : `Ko'chirish ← ${cashboxName.get(t.from_cashbox_id) ?? "kassa"}`,
        amount: outgoing ? -Number(t.amount) : Number(t.amount),
        type: "Ko'chirish",
      });
    }

    transactions = transactions
      .filter((t) => {
        const day = toIsoDay(t.date);
        if (params.from && day < params.from) return false;
        if (params.to && day > params.to) return false;
        if (params.tur && t.type !== params.tur) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  const income = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const outcome = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const tabHref = (holat?: string) => (holat ? `/finance/payments/cashbox?holat=${holat}` : "/finance/payments/cashbox");
  const cardHref = (id: string) =>
    `/finance/payments/cashbox?${new URLSearchParams({ ...(archivedView ? { holat: "arxiv" } : {}), kassa: id })}`;

  return (
    <ListPageShell
      title="Kassa"
      subtitle="Kirim-chiqim va kassalar bo'yicha qoldiq"
      tabs={<PaymentsTabs current="cashbox" />}
    >
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="space-y-3">
          <NewCashboxButton moderators={moderators} />
          <div className="flex gap-1.5 text-xs">
            <Link
              href={tabHref()}
              className={`rounded-full border px-3 py-1 ${
                !archivedView ? "border-brand-600 bg-brand-600 text-white" : "border-line text-ink-muted"
              }`}
            >
              Aktiv
            </Link>
            <Link
              href={tabHref("arxiv")}
              className={`rounded-full border px-3 py-1 ${
                archivedView ? "border-brand-600 bg-brand-600 text-white" : "border-line text-ink-muted"
              }`}
            >
              Arxiv
            </Link>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-xl border border-line p-4 text-center text-sm text-ink-faint">Kassa yo&apos;q.</p>
          ) : (
            visible.map((c) => (
              <CashboxCard
                key={c.id}
                cashbox={c}
                href={cardHref(c.id)}
                selected={c.id === selected?.id}
                students={students}
                moderators={moderators}
                otherCashboxes={all.filter((o) => !o.isArchived && o.id !== c.id).map((o) => ({ id: o.id, name: o.name }))}
              />
            ))
          )}
        </div>

        <div className="min-w-0 space-y-3">
          <InlineFilters
            storageKey="cashbox"
            configurable={false}
            fields={[
              { name: "from", label: "Sanadan", type: "date", width: "w-40" },
              { name: "to", label: "Sanagacha", type: "date", width: "w-40" },
              {
                name: "tur",
                label: "Tranzaksiya turi",
                type: "select",
                width: "w-44",
                options: [
                  { value: "Kirim", label: "Kirim" },
                  { value: "Chiqim", label: "Chiqim" },
                  { value: "Ko'chirish", label: "Ko'chirish" },
                ],
              },
            ]}
          />
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-lg bg-canvas px-3 py-1.5 text-ink-muted">
              {selected ? selected.name : "Kassa tanlanmagan"}
            </span>
            <span className="rounded-lg bg-canvas px-3 py-1.5 text-green-600">Kirim: {formatSom(income)}</span>
            <span className="rounded-lg bg-canvas px-3 py-1.5 text-red-600">Chiqim: {formatSom(outcome)}</span>
          </div>
          <ReportTable
            rows={transactions}
            rowKey={(r) => r.key}
            columns={[
              { header: "Sana", cell: (r) => formatDate(r.date) },
              { header: "Kim", cell: (r) => r.who },
              { header: "Izoh", cell: (r) => r.note || "—" },
              { header: "Tranzaksiya nomi", cell: (r) => <span className="font-medium text-ink">{r.name}</span> },
              {
                header: "Miqdori",
                cell: (r) => (
                  <span className={r.amount >= 0 ? "text-green-600" : "text-red-600"}>
                    {r.amount >= 0 ? "+" : "−"} {formatSom(Math.abs(r.amount))}
                  </span>
                ),
              },
              { header: "Tranzaksiya turi", cell: (r) => r.type },
            ]}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ink-muted">Xarajatlar</h2>
        <ExpensesList expenses={expenses} />
      </div>
    </ListPageShell>
  );
}
