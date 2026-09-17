import { requirePermission } from "@/lib/auth/session";
import { DebtorsList } from "@/components/payments/DebtorsList";
import {
  PaymentsJournal,
  type PaymentJournalRow,
} from "@/components/payments/PaymentsJournal";
import { NewPaymentButton } from "@/components/payments/NewPaymentButton";
import { MonthlyChargeButton } from "@/components/payments/MonthlyChargeButton";

export default async function PaymentsPage() {
  const { supabase } = await requirePermission("payments.manage");

  const [{ data: students }, { data: debtors }, { data: payments }] = await Promise.all([
    supabase.from("students").select("id, full_name").order("full_name"),
    supabase
      .from("students")
      .select("id, full_name, balance")
      .lt("balance", 0)
      .order("balance"),
    supabase
      .from("payments")
      .select("*, student:students(full_name)")
      .order("paid_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">To&apos;lovlar</h1>
        <div className="flex gap-2">
          <MonthlyChargeButton />
          <NewPaymentButton students={students ?? []} />
        </div>
      </div>

      <DebtorsList debtors={debtors ?? []} />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ink-muted">To&apos;lovlar jurnali</h2>
        <PaymentsJournal payments={(payments as PaymentJournalRow[]) ?? []} />
      </div>
    </div>
  );
}
