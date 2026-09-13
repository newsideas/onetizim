import { createClient } from "@/lib/supabase/server";
import { DebtorsList } from "@/components/payments/DebtorsList";
import {
  PaymentsJournal,
  type PaymentJournalRow,
} from "@/components/payments/PaymentsJournal";
import { NewPaymentButton } from "@/components/payments/NewPaymentButton";

export default async function PaymentsPage() {
  const supabase = await createClient();

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
        <h1 className="text-xl font-semibold text-white">To&apos;lovlar</h1>
        <NewPaymentButton students={students ?? []} />
      </div>

      <DebtorsList debtors={debtors ?? []} />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-white/70">To&apos;lovlar jurnali</h2>
        <PaymentsJournal payments={(payments as PaymentJournalRow[]) ?? []} />
      </div>
    </div>
  );
}
