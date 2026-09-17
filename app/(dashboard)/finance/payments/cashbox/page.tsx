import { Wallet } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { ListPageShell } from "@/components/ui/ListPage";
import { PaymentsTabs } from "@/components/finance/PaymentsTabs";
import { NewExpenseButton } from "@/components/finance/FinanceButtons";
import { ExpensesList, type ExpenseRow } from "@/components/finance/ExpensesList";
import { formatSom } from "@/lib/utils/currency";
import { METHOD_LABELS } from "@/lib/validations/payment";
import type { PaymentMethod } from "@/types/database";

interface CashBalanceRow {
  method: PaymentMethod;
  income: number;
  outcome: number;
}

export default async function CashboxPage() {
  const { supabase } = await requirePermission("payments.manage");

  const [{ data: balance }, { data: expenses, error: expensesError }] = await Promise.all([
    supabase.rpc("cash_balance_by_method"),
    supabase
      .from("expenses")
      .select("id, amount, category, method, spent_at, note")
      .order("spent_at", { ascending: false })
      .limit(100),
  ]);

  const rows = (balance ?? []) as CashBalanceRow[];
  const totalIncome = rows.reduce((sum, r) => sum + Number(r.income), 0);
  const totalOutcome = rows.reduce((sum, r) => sum + Number(r.outcome), 0);

  return (
    <ListPageShell
      title="Kassa"
      subtitle="Kirim-chiqim va usul bo'yicha qoldiq"
      actions={<NewExpenseButton />}
      tabs={<PaymentsTabs current="cashbox" />}
      notice={
        expensesError
          ? "Kassa jadvallari bazada topilmadi — 0024_finance.sql va 0025_finance_reports.sql migratsiyalarini Supabase SQL Editor'da ishga tushiring."
          : undefined
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((r) => (
          <div key={r.method} className="rounded-xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
              <Wallet size={14} aria-hidden="true" />
              {METHOD_LABELS[r.method]}
            </div>
            <div className="mt-2 text-lg font-semibold text-ink">
              {formatSom(Number(r.income) - Number(r.outcome))}
            </div>
            <div className="mt-1 text-xs text-ink-faint">
              Kirim {formatSom(Number(r.income))} · Chiqim {formatSom(Number(r.outcome))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-canvas px-4 py-3 text-sm">
        <span className="font-semibold text-ink">Umumiy qoldiq: </span>
        <span className={totalIncome - totalOutcome >= 0 ? "text-ink" : "text-red-600"}>
          {formatSom(totalIncome - totalOutcome)}
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ink-muted">Xarajatlar</h2>
        <ExpensesList expenses={(expenses ?? []) as ExpenseRow[]} />
      </div>
    </ListPageShell>
  );
}
